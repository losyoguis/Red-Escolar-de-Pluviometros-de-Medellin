/**
 * Red Escolar de Pluviómetros de Medellín · Backend v9.0-secure
 * Google Apps Script Web App
 *
 * Principios:
 * - GET/JSONP únicamente para información pública.
 * - PIN, contraseña, token administrativo y observaciones viajan por POST.
 * - PIN y contraseña se almacenan como hash SHA-256 + salt en Script Properties/hoja.
 * - Sesiones administrativas temporales en CacheService.
 * - Las respuestas POST usan postMessage para el iframe del frontend.
 */

const VERSION = 'v9.0-secure';
const SHEETS = {
  records: 'Registros',
  sites: 'Sedes',
  credentials: 'CredencialesSede'
};
const RECORD_HEADERS = [
  'registro_id','timestamp','sede_id','fecha','hora','precipitacion_mm','condicion',
  'nivel_precipitacion','estado_pluviometro','evento_climatico','rol_responsable',
  'calidad_dato','estado_validacion','foto_url','observador','observaciones'
];
const SITE_HEADERS = [
  'sede_id','nucleo','tipo','tipo_sigla','nombre','zona_territorial','tipo_territorio',
  'codigo_territorio','territorio','barrio_vereda','caracter','confianza','estado',
  'map_x','map_y','enlace_registro','qr_url'
];
const CREDENTIAL_HEADERS = ['sede_id','pin_salt','pin_hash','estado','actualizado_en'];
const PUBLIC_RECORD_FIELDS = [
  'registro_id','timestamp','sede_id','fecha','hora','precipitacion_mm','condicion',
  'nivel_precipitacion','estado_pluviometro','evento_climatico','rol_responsable',
  'calidad_dato','estado_validacion','foto_url'
];

function doGet(e) {
  const action = clean_(e && e.parameter && e.parameter.action || 'ping');
  const callback = cleanCallback_(e && e.parameter && e.parameter.callback || 'callback');
  let data;
  try {
    if (action === 'ping') data = ping_();
    else if (action === 'sedes') data = sedes_();
    else if (action === 'publicrecords') data = publicRecords_(toInt_(e.parameter.limit, 5000));
    else data = {ok:false,error:'Acción GET no permitida. Las operaciones sensibles requieren POST.',version:VERSION};
  } catch (err) {
    data = {ok:false,error:safeError_(err),version:VERSION};
  }
  return ContentService.createTextOutput(callback + '(' + safeJson_(data) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const action = clean_(p.action || '');
  const postToken = clean_(p.post_token || '');
  let data;
  try {
    if (action === 'add') data = addRecord_(p);
    else if (action === 'adminlogin') data = adminLogin_(p);
    else if (action === 'records') data = privateRecords_(p);
    else if (action === 'photostart') data = photoStart_(p);
    else if (action === 'photochunk') data = photoChunk_(p);
    else if (action === 'photofinish') data = photoFinish_(p);
    else data = {ok:false,error:'Acción POST no reconocida.',version:VERSION};
  } catch (err) {
    data = {ok:false,error:safeError_(err),version:VERSION};
  }
  return htmlPostMessage_(postToken, data);
}

function configurarBackend(spreadsheetId, adminUser, adminPassword) {
  if (!spreadsheetId) throw new Error('Indica el ID del Google Sheets central.');
  if (!adminPassword || String(adminPassword).length < 12) throw new Error('La contraseña administradora debe tener al menos 12 caracteres.');
  const props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', String(spreadsheetId).trim());
  props.setProperty('ADMIN_USER', clean_(adminUser || 'admin'));
  const salt = randomToken_(24);
  props.setProperty('ADMIN_SALT', salt);
  props.setProperty('ADMIN_PASSWORD_HASH', sha256_(salt + '|' + String(adminPassword)));
  ensureSheets_();
  return {ok:true,version:VERSION,message:'Backend configurado. Ya puedes desplegar una nueva versión del Web App.'};
}

function cambiarClaveAdmin(newPassword) {
  if (!newPassword || String(newPassword).length < 12) throw new Error('La nueva contraseña debe tener al menos 12 caracteres.');
  const props = PropertiesService.getScriptProperties();
  const salt = randomToken_(24);
  props.setProperty('ADMIN_SALT', salt);
  props.setProperty('ADMIN_PASSWORD_HASH', sha256_(salt + '|' + String(newPassword)));
  return {ok:true,message:'Contraseña administradora actualizada.'};
}

function crearOActualizarPinSede(sedeId, pin) {
  sedeId = clean_(sedeId);
  pin = digits_(pin);
  if (!sedeId) throw new Error('sede_id requerido.');
  if (pin.length < 4) throw new Error('El PIN debe tener al menos 4 dígitos.');
  const sh = sheet_(SHEETS.credentials, CREDENTIAL_HEADERS);
  const rows = objectsFromSheet_(sh);
  const existingIndex = rows.findIndex(r => clean_(r.sede_id) === sedeId);
  const salt = randomToken_(18);
  const rowObj = {sede_id:sedeId,pin_salt:salt,pin_hash:sha256_(salt + '|' + pin),estado:'ACTIVA',actualizado_en:new Date().toISOString()};
  if (existingIndex >= 0) writeObjectRow_(sh, existingIndex + 2, rowObj, CREDENTIAL_HEADERS);
  else appendObject_(sh, rowObj, CREDENTIAL_HEADERS);
  return {ok:true,sede_id:sedeId,message:'PIN actualizado sin almacenar el valor en texto plano.'};
}

function ping_() {
  ensureSheets_();
  const sh = sheet_(SHEETS.records, RECORD_HEADERS);
  return {
    ok:true,
    version:VERSION,
    message:'Backend seguro operativo',
    spreadsheetId:spreadsheet_().getId(),
    filasRegistros:Math.max(0, sh.getLastRow() - 1),
    securePost:true
  };
}

function sedes_() {
  const sh = sheet_(SHEETS.sites, SITE_HEADERS);
  const rows = objectsFromSheet_(sh).filter(r => clean_(r.sede_id));
  return {ok:true,version:VERSION,sedes:rows};
}

function publicRecords_(limit) {
  const sh = sheet_(SHEETS.records, RECORD_HEADERS);
  const rows = objectsFromSheet_(sh).slice(-Math.max(1, Math.min(10000, limit || 5000))).reverse();
  const records = rows.map(r => pick_(r, PUBLIC_RECORD_FIELDS));
  return {ok:true,version:VERSION,records:records};
}

function addRecord_(p) {
  const sedeId = clean_(p.sede_id);
  const pin = digits_(p.pin);
  if (!sedeId) throw new Error('Sede no válida.');
  if (!pin) throw new Error('PIN de sede requerido.');
  if (!validateSedePin_(sedeId, pin)) throw new Error('PIN de sede inválido.');

  const fecha = clean_(p.fecha);
  const hora = clean_(p.hora);
  const precip = Number(String(p.precipitacion_mm || '0').replace(',','.'));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error('Fecha no válida.');
  if (!/^\d{1,2}:\d{2}/.test(hora)) throw new Error('Hora no válida.');
  if (!isFinite(precip) || precip < 0 || precip > 1000) throw new Error('Precipitación fuera de rango.');

  const id = 'REG-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Bogota', 'yyyyMMdd-HHmmss') + '-' + randomToken_(6);
  const q = quality_(precip, clean_(p.estado_pluviometro));
  const record = {
    registro_id:id,
    timestamp:new Date().toISOString(),
    sede_id:sedeId,
    fecha:fecha,
    hora:hora.slice(0,5),
    precipitacion_mm:precip,
    condicion:limitText_(p.condicion,100),
    nivel_precipitacion:nivel_(precip),
    estado_pluviometro:limitText_(p.estado_pluviometro,100),
    evento_climatico:limitText_(p.evento_climatico,120),
    rol_responsable:limitText_(p.rol_responsable,80),
    calidad_dato:q.label,
    estado_validacion:q.state,
    foto_url:safeUrl_(p.foto_url),
    observador:limitText_(p.observador,120),
    observaciones:limitText_(p.observaciones,800)
  };
  appendObject_(sheet_(SHEETS.records, RECORD_HEADERS), record, RECORD_HEADERS);
  return {ok:true,version:VERSION,registro_id:id,pin_validado:true,record:record};
}

function adminLogin_(p) {
  const props = PropertiesService.getScriptProperties();
  const user = clean_(p.usuario || 'admin');
  const password = String(p.password || '');
  const expectedUser = clean_(props.getProperty('ADMIN_USER') || 'admin');
  const salt = props.getProperty('ADMIN_SALT') || '';
  const expectedHash = props.getProperty('ADMIN_PASSWORD_HASH') || '';
  if (!expectedHash) throw new Error('Administrador no configurado. Ejecuta configurarBackend().');
  if (user !== expectedUser || !timingSafeEqual_(sha256_(salt + '|' + password), expectedHash)) throw new Error('Credenciales inválidas.');
  const token = randomToken_(42);
  CacheService.getScriptCache().put('admin:' + token, user, 21600);
  return {ok:true,version:VERSION,token:token,usuario:user,expiresIn:21600};
}

function privateRecords_(p) {
  requireAdmin_(p.token);
  const limit = Math.max(1, Math.min(100000, toInt_(p.limit, 100000)));
  const rows = objectsFromSheet_(sheet_(SHEETS.records, RECORD_HEADERS)).slice(-limit).reverse();
  return {ok:true,version:VERSION,records:rows};
}

function photoStart_(p) {
  const sedeId = clean_(p.sede_id);
  const pin = digits_(p.pin);
  if (!validateSedePin_(sedeId, pin)) throw new Error('PIN de sede inválido.');
  const session = clean_(p.session);
  if (!/^PHOTO-[A-Za-z0-9-]{8,80}$/.test(session)) throw new Error('Sesión fotográfica no válida.');
  const meta = {
    session:session,
    registro_id:clean_(p.registro_id),
    cliente_registro_id:clean_(p.cliente_registro_id),
    sede_id:sedeId,
    fecha:clean_(p.fecha),
    foto_mime:limitText_(p.foto_mime || 'image/jpeg',60),
    foto_nombre:limitText_(p.foto_nombre || 'evidencia.jpg',120),
    foto_kb:limitText_(p.foto_kb,20),
    started:new Date().toISOString()
  };
  CacheService.getScriptCache().put('photo:meta:' + session, JSON.stringify(meta), 1200);
  return {ok:true,session:session};
}

function photoChunk_(p) {
  const session = clean_(p.session);
  const meta = getPhotoMeta_(session);
  if (!meta) throw new Error('Sesión de foto expirada.');
  const index = toInt_(p.index, -1), total = toInt_(p.total, -1);
  const chunk = String(p.chunk || '').replace(/\s/g,'');
  if (index < 0 || total < 1 || index >= total || total > 100) throw new Error('Parte de foto no válida.');
  if (!/^[A-Za-z0-9+/=]*$/.test(chunk) || chunk.length > 2500) throw new Error('Contenido de foto no válido.');
  const cache = CacheService.getScriptCache();
  cache.put('photo:chunk:' + session + ':' + index, chunk, 1200);
  cache.put('photo:total:' + session, String(total), 1200);
  return {ok:true,session:session,index:index,total:total};
}

function photoFinish_(p) {
  const session = clean_(p.session);
  const meta = getPhotoMeta_(session);
  if (!meta) throw new Error('Sesión de foto expirada.');
  const cache = CacheService.getScriptCache();
  const total = toInt_(cache.get('photo:total:' + session), -1);
  if (total < 1 || total > 100) throw new Error('No se encontraron todas las partes de la foto.');
  let base64 = '';
  for (let i=0;i<total;i++) {
    const chunk = cache.get('photo:chunk:' + session + ':' + i);
    if (!chunk) throw new Error('Falta la parte ' + (i+1) + ' de la foto.');
    base64 += chunk;
  }
  const bytes = Utilities.base64Decode(base64);
  if (bytes.length > 90 * 1024) throw new Error('La fotografía supera el tamaño permitido por este backend.');
  const result = uploadGithub_(meta, bytes);
  updateRecordPhoto_(meta.registro_id, result.url);
  const record = findRecord_(meta.registro_id) || {registro_id:meta.registro_id,sede_id:meta.sede_id,fecha:meta.fecha,foto_url:result.url};
  for (let i=0;i<total;i++) cache.remove('photo:chunk:' + session + ':' + i);
  cache.remove('photo:total:' + session); cache.remove('photo:meta:' + session);
  return {ok:true,version:VERSION,foto_url:result.url,record:record};
}

function uploadGithub_(meta, bytes) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('GITHUB_TOKEN');
  const owner = props.getProperty('GITHUB_OWNER');
  const repo = props.getProperty('GITHUB_REPO');
  const branch = props.getProperty('GITHUB_BRANCH') || 'main';
  const basePath = (props.getProperty('GITHUB_BASE_PATH') || 'data/evidencias').replace(/^\/+|\/+$/g,'');
  if (!token || !owner || !repo) throw new Error('GitHub no está configurado en Script Properties.');
  const safeSede = clean_(meta.sede_id).replace(/[^A-Za-z0-9_-]/g,'_');
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(meta.fecha) ? meta.fecha : Utilities.formatDate(new Date(),'America/Bogota','yyyy-MM-dd');
  const fileName = clean_(meta.registro_id || randomToken_(10)).replace(/[^A-Za-z0-9_-]/g,'_') + '.jpg';
  const path = [basePath,safeDate,safeSede,fileName].filter(Boolean).join('/');
  const api = 'https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) + '/contents/' + path.split('/').map(encodeURIComponent).join('/');
  const payload = {message:'Evidencia pluviómetro ' + meta.registro_id,content:Utilities.base64Encode(bytes),branch:branch};
  const response = UrlFetchApp.fetch(api,{method:'put',contentType:'application/json',headers:{Authorization:'Bearer ' + token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},payload:JSON.stringify(payload),muteHttpExceptions:true});
  const code = response.getResponseCode();
  const body = JSON.parse(response.getContentText() || '{}');
  if (code < 200 || code >= 300) throw new Error('GitHub rechazó la foto (' + code + '): ' + limitText_(body.message || '',180));
  const url = body && body.content && body.content.download_url;
  if (!url) throw new Error('GitHub no devolvió URL de descarga.');
  return {url:url,path:path};
}

function validateSedePin_(sedeId, pin) {
  const rows = objectsFromSheet_(sheet_(SHEETS.credentials, CREDENTIAL_HEADERS));
  const row = rows.find(r => clean_(r.sede_id) === clean_(sedeId) && clean_(r.estado || 'ACTIVA').toUpperCase() !== 'INACTIVA');
  if (!row) return false;
  const salt = clean_(row.pin_salt), expected = clean_(row.pin_hash);
  return !!salt && !!expected && timingSafeEqual_(sha256_(salt + '|' + digits_(pin)), expected);
}

function requireAdmin_(token) {
  token = clean_(token);
  const user = token && CacheService.getScriptCache().get('admin:' + token);
  if (!user) throw new Error('Sesión administrativa inválida o expirada.');
  return user;
}

function ensureSheets_() {
  sheet_(SHEETS.records, RECORD_HEADERS);
  sheet_(SHEETS.sites, SITE_HEADERS);
  sheet_(SHEETS.credentials, CREDENTIAL_HEADERS);
}

function spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID no configurado. Ejecuta configurarBackend().');
  return SpreadsheetApp.openById(id);
}

function sheet_(name, headers) {
  const ss = spreadsheet_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  else ensureHeaders_(sh, headers);
  return sh;
}

function ensureHeaders_(sh, required) {
  const lastCol = Math.max(1, sh.getLastColumn());
  const current = sh.getRange(1,1,1,lastCol).getDisplayValues()[0].map(clean_);
  const missing = required.filter(h => current.indexOf(h) < 0);
  if (missing.length) sh.getRange(1,current.length+1,1,missing.length).setValues([missing]);
}

function objectsFromSheet_(sh) {
  const lr=sh.getLastRow(), lc=sh.getLastColumn();
  if (lr < 2 || lc < 1) return [];
  const values=sh.getRange(1,1,lr,lc).getValues();
  const headers=values.shift().map(clean_);
  return values.map(row => {const o={};headers.forEach((h,i)=>{if(h)o[h]=row[i];});return o;});
}

function appendObject_(sh, obj, preferredHeaders) {
  ensureHeaders_(sh, preferredHeaders);
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(clean_);
  sh.appendRow(headers.map(h => obj[h] !== undefined ? obj[h] : ''));
}

function writeObjectRow_(sh, rowNumber, obj, preferredHeaders) {
  ensureHeaders_(sh, preferredHeaders);
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0].map(clean_);
  const existing=sh.getRange(rowNumber,1,1,headers.length).getValues()[0];
  const next=headers.map((h,i)=>obj[h] !== undefined ? obj[h] : existing[i]);
  sh.getRange(rowNumber,1,1,headers.length).setValues([next]);
}

function findRecord_(id) {
  id=clean_(id); if(!id)return null;
  return objectsFromSheet_(sheet_(SHEETS.records, RECORD_HEADERS)).find(r=>clean_(r.registro_id)===id) || null;
}

function updateRecordPhoto_(id, url) {
  const sh=sheet_(SHEETS.records, RECORD_HEADERS);
  const values=sh.getDataRange().getValues(); if(values.length<2)return false;
  const headers=values[0].map(clean_), idCol=headers.indexOf('registro_id'), photoCol=headers.indexOf('foto_url');
  if(idCol<0||photoCol<0)return false;
  for(let i=1;i<values.length;i++) if(clean_(values[i][idCol])===clean_(id)){sh.getRange(i+1,photoCol+1).setValue(url);return true;}
  return false;
}

function getPhotoMeta_(session) {
  if (!session) return null;
  const raw = CacheService.getScriptCache().get('photo:meta:' + session);
  try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; }
}

function quality_(precip, estado) {
  const e = clean_(estado).toLowerCase();
  if (/dañado|inclinado|movido/.test(e)) return {label:'Revisión prioritaria',state:'Revisar'};
  if (precip > 70) return {label:'Revisión prioritaria',state:'Revisar'};
  if (precip > 30 || /limpieza/.test(e)) return {label:'Para seguimiento',state:'Revisar'};
  return {label:'Dato normal',state:'Validado'};
}
function nivel_(n){n=Number(n)||0;if(n<=0)return 'Sin precipitación';if(n<=2.5)return 'Muy bajo';if(n<=10)return 'Bajo';if(n<=30)return 'Medio';return 'Alto';}
function pick_(obj, fields){const out={};fields.forEach(k=>out[k]=obj[k]!==undefined?obj[k]:'');return out;}
function clean_(v){return String(v===undefined||v===null?'':v).trim().replace(/[<>]/g,'');}
function digits_(v){return String(v||'').replace(/\D/g,'');}
function limitText_(v,n){return clean_(v).slice(0,n||500);}
function safeUrl_(v){const s=clean_(v);return /^https:\/\//i.test(s)?s:'';}
function toInt_(v,d){const n=parseInt(v,10);return isFinite(n)?n:d;}
function safeError_(e){return limitText_(e && e.message ? e.message : e,300) || 'Error inesperado.';}
function randomToken_(len){const raw=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');return raw.slice(0,len||32);}
function sha256_(text){const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(text),Utilities.Charset.UTF_8);return bytes.map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function timingSafeEqual_(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
function cleanCallback_(v){const c=String(v||'callback').replace(/[^A-Za-z0-9_.$]/g,'');return c||'callback';}
function safeJson_(obj){return JSON.stringify(obj).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');}
function htmlPostMessage_(token,data){
  const payload=safeJson_({source:'redPluvioAppsScript',token:clean_(token),data:data});
  const html='<!doctype html><html><body><script>try{parent.postMessage('+payload+',"*");}catch(e){}<\/script></body></html>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
