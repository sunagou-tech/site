"use client";

import { useState, useEffect, useRef } from "react";
import {
  defaultConfig, SiteConfig, SitePage, SectionBlock, Article,
  uid, BLOCK_META,
} from "@/types/site";
import SitePreview from "@/components/preview/SitePreview";
import BlockInsertModal from "@/components/admin/BlockInsertModal";
import { RefreshCw, ExternalLink, Plus, Layout, Globe, Check, AlertCircle, Undo2, Image, Copy, Trash2 } from "lucide-react";
import { EditingContext } from "@/contexts/EditingContext";
import { ImagePickContext } from "@/contexts/ImagePickContext";
import { publishSite, isSupabaseConfigured } from "@/lib/supabase";

type SidePanel = "settings" | "blocks" | "upload" | "ai-image" | "seo" | "column";
type DeviceMode = "pc" | "tablet" | "sp";
interface PageTab { id: string; slug: string; title: string; isHome: boolean; }
interface UploadedImage { id: string; name: string; url: string; uploadedAt: number; }

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "") || "my-site";
}

export default function AdminClient() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [undoStack, setUndoStack] = useState<SiteConfig[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // AI 画像生成
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiStyleIdx, setAiStyleIdx] = useState(0);
  const [aiSizeIdx, setAiSizeIdx] = useState(0);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [aiGeneratedUrl, setAiGeneratedUrl] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState("home");
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Device preview
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("pc");
  const [previewKey, setPreviewKey] = useState(0);

  // Sidebar state
  const [sidePanel, setSidePanel] = useState<SidePanel>("blocks");
  const [blockDragIdx, setBlockDragIdx] = useState<number | null>(null);
  const [blockDragOver, setBlockDragOver] = useState<number | null>(null);

  // Block insert modal
  const [insertPosition, setInsertPosition] = useState<number | null>(null); // null = append
  const [showBlockModal, setShowBlockModal] = useState(false);

  // 画像ピック（ライブラリ → ブロック配置）
  const [pickedUrl, setPickedUrl] = useState<string | null>(null);

  // Slug / publish
  const [siteSlug, setSiteSlug] = useState("");
  const [editingSlug, setEditingSlug] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "success" | "error">("idle");
  const [publishError, setPublishError] = useState("");

  // HTML直接編集モード（デモ生成時）
  const [htmlMode,    setHtmlMode]    = useState(false);
  const [siteHtml,    setSiteHtml]    = useState("");
  const [htmlBlobUrl, setHtmlBlobUrl] = useState("");
  const latestHtmlRef = useRef("");
  const htmlIframeRef = useRef<HTMLIFrameElement>(null);
  // ドラッグ&ドロップ用
  const [isDragging, setIsDragging] = useState(false);
  const dragUrlRef = useRef("");
  // HTML編集モードのアンドゥ
  const [htmlUndoCount, setHtmlUndoCount] = useState(0);
  const htmlUndoStackRef = useRef<string[]>([]);

  // HTML → Blob URL（右パネル付きインライン編集）
  useEffect(() => {
    if (!siteHtml) return;
    const script = `<script>
(function(){
  if(document.getElementById('__ce_panel'))return;

  /* ─ 0. 親との画像同期 ─────────────────────────────────────── */
  var pendingUrl='';
  function applyImg(img,url){
    img.src=url;img.style.visibility='';img.style.display='';
    img.classList.remove('on');
    window.parent.postMessage({type:'html-update',html:getCleanHtml()},'*');
    window.parent.postMessage({type:'clear-picked-url'},'*');
    pendingUrl='';
  }
  window.addEventListener('message',function(ev){
    if(!ev.data)return;
    if(ev.data.type==='set-pending-url'){pendingUrl=ev.data.url||'';}
    if(ev.data.type==='drop-image'){
      var el=document.elementFromPoint(ev.data.x,ev.data.y);
      for(var i=0;i<5&&el&&el!==document.body;i++){
        if(el.classList&&el.classList.contains('ce-img')){applyImg(el,ev.data.url);return;}
        var ci=el.querySelector&&el.querySelector('.ce-img');
        if(ci){applyImg(ci,ev.data.url);return;}
        el=el.parentElement;
      }
    }
  });

  /* ─ 1. ナビゲーション防止 ──────────────────────────────────── */
  document.addEventListener('click',function(e){
    var node=e.target;
    var foundAnchor=null,foundCe=null;
    while(node&&node.tagName){
      if((node.tagName==='A'||node.tagName==='FORM')&&!foundAnchor)foundAnchor=node;
      if(node.classList&&node.classList.contains('ce')&&!foundCe)foundCe=node;
      if(node.classList&&node.classList.contains('ce-img')&&!foundCe)foundCe=node;
      node=node.parentNode;
    }
    // ::before等の疑似要素がクリックを横取りする場合: 子孫のce-imgを探す
    if(!foundCe){var t2=e.target;for(var d=0;d<3&&t2&&t2.querySelector;d++){var ci=t2.querySelector('.ce-img');if(ci){foundCe=ci;break;}t2=t2.parentElement;}}
    if(foundAnchor) e.preventDefault();
    if(foundCe||foundAnchor){
      e.stopImmediatePropagation(); // beneseのすべてのクリックハンドラをブロック
      if(foundCe){
        if(foundCe.classList.contains('ce-img'))openImg(foundCe);
        else openText(foundCe);
      }
    }
  },true);

  /* ─ 2. CSS ─────────────────────────────────────────────────── */
  var st=document.createElement('style');
  st.id='__ce_style';
  st.textContent=
    '.ce{cursor:text!important;pointer-events:auto!important}'+
    '.ce:hover{box-shadow:0 0 0 2px rgba(79,70,229,0.5)!important}'+
    '.ce.on{box-shadow:0 0 0 2px #4F46E5!important;caret-color:#4F46E5!important}'+
    '.ce-img{cursor:pointer!important;pointer-events:auto!important}'+
    '.ce-img:hover{box-shadow:0 0 0 3px rgba(79,70,229,0.5)!important;opacity:0.9!important}'+
    '.ce-img.on{box-shadow:0 0 0 3px #4F46E5!important}';
  document.head.appendChild(st);

  /* ─ 3. 右パネル ────────────────────────────────────────────── */
  var isNarrow=window.innerWidth<768;
  var panel=document.createElement('div');
  panel.id='__ce_panel';
  panel.style.cssText=isNarrow
    ?'position:fixed;bottom:0;left:0;right:0;width:100%;max-height:56vh;background:#fff;border-top:2.5px solid #4F46E5;box-shadow:0 -4px 28px rgba(0,0,0,0.22);z-index:2147483646;display:none;flex-direction:column;font-family:system-ui,sans-serif;font-size:12px;overflow:hidden;border-radius:12px 12px 0 0;'
    :'position:fixed;top:0;right:0;width:216px;height:100vh;background:#fff;border-left:1.5px solid #E2E8F0;box-shadow:-4px 0 20px rgba(0,0,0,0.1);z-index:2147483646;display:none;flex-direction:column;font-family:system-ui,sans-serif;font-size:12px;';
  /* 広い画面ではコンテンツがパネルに隠れないようpaddingを確保 */
  if(!isNarrow){document.body.style.paddingRight='216px';}
  var pH=document.createElement('div');
  pH.style.cssText='padding:9px 10px;background:#4F46E5;color:#fff;font-size:12px;font-weight:700;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:4px;'+(isNarrow?'cursor:pointer;':'');
  var pHText=document.createElement('span');pHText.textContent='✏️ 編集';
  var pHClose=document.createElement('button');pHClose.innerHTML='✕&nbsp;閉じる';
  pHClose.style.cssText='background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.28);color:#fff;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:10px;white-space:nowrap;line-height:1.4;flex-shrink:0;';
  pHClose.addEventListener('click',function(e){e.stopPropagation();discard();});
  pH.appendChild(pHText);pH.appendChild(pHClose);
  var pB=document.createElement('div');
  pB.style.cssText='flex:1;overflow-y:auto;padding:11px;display:flex;flex-direction:column;gap:9px;';
  var pF=document.createElement('div');
  pF.style.cssText='padding:7px 10px;border-top:1px solid #F1F5F9;display:flex;gap:4px;flex-shrink:0;flex-wrap:wrap;';
  var bOk=document.createElement('button');
  bOk.textContent='✓ 確定';
  bOk.style.cssText='flex:1;min-width:52px;padding:6px 4px;background:#4F46E5;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:700;';
  var bCnl=document.createElement('button');
  bCnl.textContent='✕';
  bCnl.style.cssText='padding:6px 9px;background:#fff;color:#6B7280;border:1px solid #D1D5DB;border-radius:6px;cursor:pointer;font-size:11px;';
  var bDel=document.createElement('button');
  bDel.textContent='🗑';bDel.title='削除';
  bDel.style.cssText='padding:6px 9px;background:#FFF5F5;color:#EF4444;border:1px solid #FEE2E2;border-radius:6px;cursor:pointer;font-size:13px;';
  var bClone=document.createElement('button');
  bClone.textContent='＋複製';
  bClone.style.cssText='padding:6px 7px;background:#F0FDF4;color:#059669;border:1px solid #D1FAE5;border-radius:6px;cursor:pointer;font-size:11px;';
  pF.appendChild(bOk);pF.appendChild(bCnl);pF.appendChild(bDel);pF.appendChild(bClone);
  panel.appendChild(pH);panel.appendChild(pB);panel.appendChild(pF);
  document.body.appendChild(panel);

  /* ─ 4. 状態 ─────────────────────────────────────────────────── */
  var cur=null,origHtml='',isImg=false;

  function rgb2hex(s){var m=(s||'').match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);if(!m)return'#000000';return'#'+[m[1],m[2],m[3]].map(function(x){return('0'+parseInt(x).toString(16)).slice(-2);}).join('');}
  function lbl(t){var d=document.createElement('div');d.style.cssText='font-size:10px;font-weight:700;color:#64748B;letter-spacing:0.04em;';d.textContent=t;return d;}
  function rw(){var d=document.createElement('div');d.style.cssText='display:flex;gap:4px;align-items:center;';return d;}
  function numBtn(ch,fn){var b=document.createElement('button');b.textContent=ch;b.style.cssText='width:26px;height:26px;border:1px solid #E2E8F0;border-radius:6px;background:#F8FAFC;cursor:pointer;font-size:15px;flex-shrink:0;';b.addEventListener('click',fn);return b;}

  function getCleanHtml(){
    var s=document.getElementById('__ce_style'),p=document.getElementById('__ce_panel');
    if(s)s.remove();if(p)p.remove();
    // body に追加したpadding等をHTMLに焼き付けないよう一時退避
    var origPR=document.body.style.paddingRight;
    var origPB=document.body.style.paddingBottom;
    document.body.style.paddingRight='';
    document.body.style.paddingBottom='';
    var h=document.documentElement.outerHTML;
    if(s)document.head.appendChild(s);if(p)document.body.appendChild(p);
    document.body.style.paddingRight=origPR;
    document.body.style.paddingBottom=origPB;
    return h;
  }

  function save(){
    if(cur&&!isImg){cur.contentEditable='false';cur.classList.remove('on');}
    else if(cur&&isImg){cur.classList.remove('on');}
    panel.style.display='none';pB.innerHTML='';
    var el=cur;cur=null;origHtml='';isImg=false;
    if(el)window.parent.postMessage({type:'html-update',html:getCleanHtml()},'*');
  }
  function discard(){
    if(cur&&!isImg){cur.innerHTML=origHtml;cur.contentEditable='false';cur.classList.remove('on');}
    else if(cur&&isImg){cur.classList.remove('on');}
    panel.style.display='none';pB.innerHTML='';cur=null;origHtml='';isImg=false;
  }
  bOk.addEventListener('click',function(e){e.stopPropagation();save();});
  bCnl.addEventListener('click',function(e){e.stopPropagation();discard();});
  bDel.addEventListener('click',function(e){e.stopPropagation();deleteEl();});
  bClone.addEventListener('click',function(e){e.stopPropagation();cloneEl();});

  // 削除・複製対象を決定（コンテンツブロックは自分ごと、アイコン系は親ごと）
  function getTarget(el){
    if(el.tagName==='A'||el.tagName==='BUTTON')return el;
    var par=el.parentElement;if(!par)return el;
    var PROTECT=['BODY','SECTION','ARTICLE','ASIDE','HEADER','FOOTER','MAIN','NAV','FORM','UL','OL','A','BUTTON'];
    if(PROTECT.indexOf(par.tagName)>=0)return el;
    // 子なし＆テキスト5文字以内 → アイコン/記号 → 親ブロックごと削除
    var isIcon=(el.children.length===0&&el.textContent.trim().length<5);
    if(isIcon&&par.children.length<=4)return par;
    // コンテンツブロック（子あり or テキスト長め） → 自分自身を削除
    if(!isIcon&&par.children.length<=2)return par;
    return el;
  }
  function deleteEl(){
    if(!cur)return;
    cur.classList.remove('on');
    if(isImg){
      // 画像は非表示（ドラッグ&ドロップで復元可能）
      cur.style.visibility='hidden';
      panel.style.display='none';pB.innerHTML='';cur=null;origHtml='';isImg=false;
      window.parent.postMessage({type:'html-update',html:getCleanHtml()},'*');
      return;
    }
    cur.contentEditable='false';
    var t=getTarget(cur);
    panel.style.display='none';pB.innerHTML='';cur=null;origHtml='';isImg=false;
    t.remove();
    window.parent.postMessage({type:'html-update',html:getCleanHtml()},'*');
  }
  function cloneEl(){
    if(!cur||isImg)return;
    var t=getTarget(cur);
    var clone=t.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(function(c){c.removeAttribute('contenteditable');});
    clone.querySelectorAll('.on').forEach(function(c){c.classList.remove('on');});
    if(clone.hasAttribute('contenteditable'))clone.removeAttribute('contenteditable');
    clone.classList&&clone.classList.remove('on');
    t.parentNode.insertBefore(clone,t.nextSibling);
    save();
  }
  // Google Fontダイナミックロード
  var loadedFonts={};
  function loadFont(name){
    if(!name||name==='inherit'||loadedFonts[name])return;
    loadedFonts[name]=true;
    var lk=document.createElement('link');lk.rel='stylesheet';
    lk.href='https://fonts.googleapis.com/css2?family='+name.replace(/ /g,'+')+':wght@400;700;900&display=swap';
    document.head.appendChild(lk);
  }

  /* ─ 5. テキストパネル ─────────────────────────────────────── */
  function buildText(el){
    pB.innerHTML='';
    var cs=window.getComputedStyle(el);
    var tag=document.createElement('span');
    tag.style.cssText='background:#EEF2FF;color:#4F46E5;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;';
    tag.textContent='<'+el.tagName.toLowerCase()+'>';pB.appendChild(tag);

    // 文字サイズ
    pB.appendChild(lbl('文字サイズ'));
    var fsr=rw();var fsv=parseFloat(cs.fontSize)||16;
    var fsd=document.createElement('span');fsd.style.cssText='flex:1;text-align:center;font-size:13px;font-weight:600;';fsd.textContent=Math.round(fsv)+'px';
    fsr.appendChild(numBtn('−',function(){fsv=Math.max(8,fsv-1);el.style.fontSize=fsv+'px';fsd.textContent=Math.round(fsv)+'px';}));
    fsr.appendChild(fsd);
    fsr.appendChild(numBtn('+',function(){fsv++;el.style.fontSize=fsv+'px';fsd.textContent=Math.round(fsv)+'px';}));
    pB.appendChild(fsr);

    // 太さ
    pB.appendChild(lbl('太さ'));
    var fwr=rw();var bold=parseInt(cs.fontWeight)>=700;
    [['標準','400'],['太字','700']].forEach(function(p,i){
      var b=document.createElement('button');b.textContent=p[0];
      var a=(i===0&&!bold)||(i===1&&bold);
      b.style.cssText='flex:1;padding:5px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:'+(i?'700':'400')+';background:'+(a?'#4F46E5':'#F8FAFC')+';color:'+(a?'#fff':'#374151')+';border:1px solid '+(a?'#4F46E5':'#E2E8F0')+';';
      b.addEventListener('click',function(){
        el.style.fontWeight=p[1];
        fwr.querySelectorAll('button').forEach(function(btn,j){var x=j===i;btn.style.background=x?'#4F46E5':'#F8FAFC';btn.style.color=x?'#fff':'#374151';btn.style.border='1px solid '+(x?'#4F46E5':'#E2E8F0');});
      });
      fwr.appendChild(b);
    });pB.appendChild(fwr);

    // 揃え
    pB.appendChild(lbl('揃え'));
    var tar=rw();var ca=cs.textAlign;
    [['left','左'],['center','中央'],['right','右']].forEach(function(p,i){
      var b=document.createElement('button');b.textContent=p[1];
      var a=ca===p[0]||(i===0&&(ca==='start'||ca===''));
      b.style.cssText='flex:1;padding:5px;border-radius:6px;cursor:pointer;font-size:11px;background:'+(a?'#4F46E5':'#F8FAFC')+';color:'+(a?'#fff':'#374151')+';border:1px solid '+(a?'#4F46E5':'#E2E8F0')+';';
      b.addEventListener('click',function(){
        el.style.textAlign=p[0];
        tar.querySelectorAll('button').forEach(function(btn,j){var x=j===i;btn.style.background=x?'#4F46E5':'#F8FAFC';btn.style.color=x?'#fff':'#374151';btn.style.border='1px solid '+(x?'#4F46E5':'#E2E8F0');});
      });
      tar.appendChild(b);
    });pB.appendChild(tar);

    // 文字色
    pB.appendChild(lbl('文字色'));
    var cr=rw();
    var ci=document.createElement('input');ci.type='color';ci.value=rgb2hex(cs.color);
    ci.style.cssText='width:34px;height:28px;border:1px solid #E2E8F0;border-radius:6px;cursor:pointer;padding:2px;';
    var cl=document.createElement('span');cl.style.cssText='font-size:11px;font-family:monospace;color:#374151;';cl.textContent=ci.value;
    ci.addEventListener('input',function(){el.style.color=ci.value;cl.textContent=ci.value;});
    cr.appendChild(ci);cr.appendChild(cl);pB.appendChild(cr);

    // フォント (14種類)
    pB.appendChild(lbl('フォント'));
    var fs=document.createElement('select');
    fs.style.cssText='width:100%;padding:5px 7px;border:1px solid #E2E8F0;border-radius:6px;font-size:11px;background:#fff;color:#111;';
    [['inherit','デフォルト'],['Noto Sans JP','Noto Sans JP'],['Noto Serif JP','Noto Serif JP'],['M PLUS Rounded 1c','M PLUS 丸ゴシック'],['Zen Kaku Gothic New','Zen 角ゴシック'],['Shippori Mincho','しっぽり明朝'],['BIZ UDPGothic','BIZ UDゴシック'],['BIZ UDPMincho','BIZ UD明朝'],['Kaisei Decol','Kaisei Decol'],['Dela Gothic One','Dela Gothic (強調)'],['Yomogi','Yomogi (手書き)'],['Hachi Maru Pop','ハチマルポップ'],['RocknRoll One','RocknRoll One'],['Reggae One','Reggae One']].forEach(function(f){
      var o=document.createElement('option');o.value=f[0];o.textContent=f[1];
      if(f[0]!=='inherit'&&cs.fontFamily.indexOf(f[0].split(' ')[0])>=0)o.selected=true;
      fs.appendChild(o);
    });
    fs.addEventListener('change',function(){loadFont(fs.value);el.style.fontFamily=fs.value==='inherit'?'':fs.value;});
    pB.appendChild(fs);

    // 行間
    pB.appendChild(lbl('行間'));
    var lhr=rw();var lhv=parseFloat(cs.lineHeight)||1.6;if(lhv>10)lhv=(lhv/parseFloat(cs.fontSize))||1.6;
    var lhd=document.createElement('span');lhd.style.cssText='flex:1;text-align:center;font-size:13px;font-weight:600;';lhd.textContent=lhv.toFixed(1);
    lhr.appendChild(numBtn('−',function(){lhv=Math.max(1,+(lhv-0.1).toFixed(1));el.style.lineHeight=lhv;lhd.textContent=lhv.toFixed(1);}));
    lhr.appendChild(lhd);
    lhr.appendChild(numBtn('+',function(){lhv=+(lhv+0.1).toFixed(1);el.style.lineHeight=lhv;lhd.textContent=lhv.toFixed(1);}));
    pB.appendChild(lhr);

    // 背景色
    pB.appendChild(lbl('背景色'));
    var bgr=rw();
    var bgi=document.createElement('input');bgi.type='color';bgi.value=rgb2hex(cs.backgroundColor);
    bgi.style.cssText='width:34px;height:28px;border:1px solid #E2E8F0;border-radius:6px;cursor:pointer;padding:2px;';
    var bgl=document.createElement('span');bgl.style.cssText='font-size:11px;font-family:monospace;color:#374151;';bgl.textContent=bgi.value;
    bgi.addEventListener('input',function(){el.style.backgroundColor=bgi.value;bgl.textContent=bgi.value;});
    bgr.appendChild(bgi);bgr.appendChild(bgl);pB.appendChild(bgr);

    // リンクURL (A/BUTTONのとき表示)
    if(el.tagName==='A'||el.tagName==='BUTTON'){
      pB.appendChild(lbl('リンクURL'));
      var li=document.createElement('input');li.type='url';
      li.value=el.getAttribute('href')||'';li.placeholder='https://example.com';
      li.style.cssText='width:100%;padding:5px 7px;border:1px solid #E2E8F0;border-radius:6px;font-size:10px;color:#111;box-sizing:border-box;';
      li.addEventListener('input',function(){el.setAttribute('href',li.value);});
      pB.appendChild(li);
    }
  }

  /* ─ 6. 画像パネル ────────────────────────────────────────── */
  function buildImg(img){
    pB.innerHTML='';
    var pv=document.createElement('img');pv.src=img.src;pv.style.cssText='width:100%;height:90px;object-fit:cover;border-radius:6px;border:1px solid #E2E8F0;';pB.appendChild(pv);
    pB.appendChild(lbl('画像URL'));
    var ui=document.createElement('input');ui.type='text';ui.value=img.src;
    ui.style.cssText='width:100%;padding:5px 7px;border:1px solid #E2E8F0;border-radius:6px;font-size:10px;color:#111;box-sizing:border-box;';
    ui.addEventListener('input',function(){img.src=ui.value;pv.src=ui.value;});pB.appendChild(ui);
    pB.appendChild(lbl('alt テキスト'));
    var ai=document.createElement('input');ai.type='text';ai.value=img.alt||'';ai.style.cssText=ui.style.cssText;
    ai.addEventListener('input',function(){img.alt=ai.value;});pB.appendChild(ai);
    // object-fit
    pB.appendChild(lbl('フィット'));
    var ftr=rw();var cs2=window.getComputedStyle(img);var curFit=img.style.objectFit||cs2.objectFit||'cover';
    ['cover','contain','fill'].forEach(function(fit){
      var b=document.createElement('button');b.textContent=fit;
      var a=curFit===fit;
      b.style.cssText='flex:1;padding:5px 2px;border-radius:6px;cursor:pointer;font-size:10px;background:'+(a?'#4F46E5':'#F8FAFC')+';color:'+(a?'#fff':'#374151')+';border:1px solid '+(a?'#4F46E5':'#E2E8F0')+';';
      b.addEventListener('click',function(){
        img.style.objectFit=fit;curFit=fit;
        ftr.querySelectorAll('button').forEach(function(btn){var x=btn.textContent===fit;btn.style.background=x?'#4F46E5':'#F8FAFC';btn.style.color=x?'#fff':'#374151';btn.style.border='1px solid '+(x?'#4F46E5':'#E2E8F0');});
      });
      ftr.appendChild(b);
    });pB.appendChild(ftr);
    // object-position
    pB.appendChild(lbl('表示位置'));
    var pgrid=document.createElement('div');pgrid.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:3px;';
    var curPos=img.style.objectPosition||'center center';
    [['left top','↖'],['center top','↑'],['right top','↗'],['left center','←'],['center center','・'],['right center','→'],['left bottom','↙'],['center bottom','↓'],['right bottom','↘']].forEach(function(p){
      var b=document.createElement('button');b.textContent=p[1];
      var a=curPos.replace('center','center center').indexOf(p[0])>=0||curPos===p[0];
      b.style.cssText='padding:6px;border-radius:5px;cursor:pointer;font-size:14px;line-height:1;background:'+(a?'#4F46E5':'#F8FAFC')+';color:'+(a?'#fff':'#374151')+';border:1px solid '+(a?'#4F46E5':'#E2E8F0')+';';
      b.addEventListener('click',function(){
        img.style.objectPosition=p[0];curPos=p[0];
        pgrid.querySelectorAll('button').forEach(function(btn,j){var x=btn.textContent===p[1];btn.style.background=x?'#4F46E5':'#F8FAFC';btn.style.color=x?'#fff':'#374151';btn.style.border='1px solid '+(x?'#4F46E5':'#E2E8F0');});
      });
      pgrid.appendChild(b);
    });pB.appendChild(pgrid);
    // ヒント
    var hint=document.createElement('p');hint.style.cssText='font-size:9px;color:#94A3B8;margin:6px 0 0;line-height:1.5;';hint.textContent='💡 左ライブラリから画像をドラッグしてこのエリアにドロップすると差し替えできます';pB.appendChild(hint);
  }

  /* ─ 7. 要素を開く ───────────────────────────────────────── */
  function openText(el){
    if(cur===el)return;if(cur)save();
    cur=el;origHtml=el.innerHTML;isImg=false;
    el.contentEditable='true';el.classList.add('on');el.focus({preventScroll:true});
    pHText.textContent='✏️ テキスト編集';buildText(el);panel.style.display='flex';
  }
  function openImg(img){
    // ライブラリから画像が選択済みならそのまま適用
    if(pendingUrl){applyImg(img,pendingUrl);return;}
    if(cur===img)return;if(cur)save();
    cur=img;isImg=true;img.classList.add('on');
    pHText.textContent='🖼️ 画像編集';buildImg(img);panel.style.display='flex';
  }

  /* ─ 8. 対象要素にイベント付与 ──────────────────────────── */
  var SKIP=['SECTION','ARTICLE','ASIDE','HEADER','FOOTER','NAV','UL','OL','TABLE','TBODY','TR','FORM'];
  // ブロック要素タグ（DIVが直接これらを子に持つ場合はレイアウトラッパーと判定）
  var BLOCK_TAGS=['DIV','P','H1','H2','H3','H4','H5','H6','SECTION','ARTICLE','ASIDE','HEADER','FOOTER','NAV','MAIN','UL','OL','DL','BLOCKQUOTE','PRE'];
  document.querySelectorAll(
    'h1,h2,h3,h4,h5,h6,p,li,td,th,label,dt,dd,figcaption,span,small,strong,em,a,button,div'
  ).forEach(function(el){
    if(el.closest('#__ce_panel'))return;
    if(!el.textContent.trim())return;
    for(var i=0;i<el.children.length;i++){if(SKIP.indexOf(el.children[i].tagName)>=0)return;}
    // DIV判定: ブロック子要素を直接持ち、かつ直接テキストノードも持たない場合はレイアウトラッパー
    // → バッジ・ラベル系(子なし or インラインのみ)は直接テキストがなくてもOK
    if(el.tagName==='DIV'){
      var hasDT=Array.from(el.childNodes).some(function(n){return n.nodeType===3&&n.textContent.trim();});
      if(!hasDT){
        // ブロック子要素があるか確認
        var hasBC=false;
        for(var j=0;j<el.children.length;j++){if(BLOCK_TAGS.indexOf(el.children[j].tagName)>=0){hasBC=true;break;}}
        if(hasBC)return; // ブロック子あり＋直接テキストなし → レイアウトラッパーとして除外
        // インライン子のみ(spanなどで包まれたバッジ等) → 子要素が多すぎる場合は除外
        if(el.children.length>6)return;
      }
    }
    el.classList.add('ce');
    el.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();discard();}});
  });
  document.querySelectorAll('img').forEach(function(img){
    if(img.closest('#__ce_panel'))return;
    img.classList.add('ce-img');
  });

  /* ─ 9. パネル外クリックで保存 ──────────────────────────── */
  document.addEventListener('mousedown',function(e){
    if(!cur)return;
    if(panel.contains(e.target))return;
    if(cur&&cur.contains(e.target))return;
    save();
  });
})();
<\/script>`;
    const injected = siteHtml.replace('</body>', script + '</body>');
    const url = URL.createObjectURL(new Blob([injected], { type: "text/html" }));
    setHtmlBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [siteHtml]);

  // iframeからのテキスト変更を受け取る（編集後のHTMLをsessionStorageに保存）
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "html-update") {
        // アンドゥスタック: 変更前のHTMLを積む
        if (latestHtmlRef.current) {
          htmlUndoStackRef.current = [...htmlUndoStackRef.current.slice(-19), latestHtmlRef.current];
          setHtmlUndoCount(htmlUndoStackRef.current.length);
        }
        latestHtmlRef.current = e.data.html;
        try { sessionStorage.setItem("site-html", e.data.html); } catch {}
      }
      if (e.data?.type === "clear-picked-url") {
        setPickedUrl(null);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // pickedUrl をiframeに同期（HTMLモードでクリック配置を可能にする）
  useEffect(() => {
    if (!htmlMode) return;
    htmlIframeRef.current?.contentWindow?.postMessage(
      { type: "set-pending-url", url: pickedUrl ?? "" }, "*"
    );
  }, [pickedUrl, htmlMode]);

  // ドラッグ終了時にisDraggingをリセット（ドロップせずに終わった場合も）
  useEffect(() => {
    const handler = () => { setIsDragging(false); dragUrlRef.current = ""; };
    document.addEventListener("dragend", handler);
    return () => document.removeEventListener("dragend", handler);
  }, []);

  // Load from sessionStorage (HTML mode) or localStorage (block mode) on mount
  useEffect(() => {
    const mode = sessionStorage.getItem("site-mode");
    if (mode === "html") {
      const html = sessionStorage.getItem("site-html") ?? "";
      setHtmlMode(true);
      setSiteHtml(html);
      latestHtmlRef.current = html;
      setSidePanel("blocks");
      // sessionStorageはリフレッシュでも残す（タブを閉じるまで保持）
      return;
    }
    sessionStorage.removeItem("site-html");
    const saved = localStorage.getItem("site-config");
    if (saved) try {
      const sanitized = saved.replace(/https:\/\/picsum\.photos[^"]*/g, "");
      setConfig(JSON.parse(sanitized));
    } catch {}
    const savedSlug = localStorage.getItem("site-slug");
    if (savedSlug) setSiteSlug(savedSlug);
    const savedImages = localStorage.getItem("uploaded-images");
    if (savedImages) try { setUploadedImages(JSON.parse(savedImages)); } catch {}
  }, []);

  // ── Image upload ───────────────────────────────────────────
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    files.forEach((file) => {
      if (file.size > 3 * 1024 * 1024) {
        alert(`${file.name} は3MBを超えています。圧縮してからアップロードしてください。`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        const newImg: UploadedImage = { id: uid(), name: file.name, url, uploadedAt: Date.now() };
        setUploadedImages((prev) => {
          const next = [newImg, ...prev];
          try { localStorage.setItem("uploaded-images", JSON.stringify(next)); } catch {
            alert("ストレージ容量が不足しています。不要な画像を削除してください。");
          }
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function deleteUploadedImage(id: string) {
    setUploadedImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      localStorage.setItem("uploaded-images", JSON.stringify(next));
      return next;
    });
  }

  function copyImageUrl(img: UploadedImage) {
    navigator.clipboard.writeText(img.url).then(() => {
      setCopiedId(img.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  // Debounced auto-save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!siteSlug) setSiteSlug(toSlug(config.title));
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem("site-config", JSON.stringify(config));
    }, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (siteSlug) localStorage.setItem("site-slug", siteSlug);
  }, [siteSlug]);

  // ── Undo ──────────────────────────────────────────────────
  function updateConfig(next: SiteConfig) {
    setUndoStack((prev) => [...prev.slice(-49), config]); // 最大50件
    setConfig(next);
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setConfig(prev);
  }

  // ── AI 画像生成 ────────────────────────────────────────────
  const AI_STYLES = [
    { label: "リアル写真", en: "realistic photography, professional, high quality, 4k" },
    { label: "イラスト",   en: "flat illustration, digital art, clean vector style" },
    { label: "シネマ",     en: "cinematic, dramatic lighting, film photography" },
    { label: "ミニマル",   en: "minimal, clean, white background, simple" },
  ];
  const AI_SIZES = [
    { label: "横長 (PC)", w: 1080, h: 680 },
    { label: "縦長 (SP)", w: 800,  h: 1200 },
    { label: "正方形",    w: 800,  h: 800 },
  ];

  function generateAiImage() {
    if (!aiPrompt.trim()) return;
    setAiStatus("loading");
    setAiGeneratedUrl(null);
    const { w, h } = AI_SIZES[aiSizeIdx];
    const fullPrompt = `${aiPrompt}, ${AI_STYLES[aiStyleIdx].en}`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${w}&height=${h}&nologo=true&seed=${Math.floor(Math.random() * 99999)}&model=turbo`;
    const img = new window.Image();
    img.onload = () => { setAiGeneratedUrl(url); setAiStatus("done"); };
    img.onerror = () => setAiStatus("error");
    img.src = url;
  }

  function saveAiImageToLibrary() {
    if (!aiGeneratedUrl) return;
    const newImg: UploadedImage = {
      id: uid(), name: `AI生成_${new Date().toLocaleDateString("ja")}`, url: aiGeneratedUrl, uploadedAt: Date.now(),
    };
    setUploadedImages((prev) => {
      const next = [newImg, ...prev];
      try { localStorage.setItem("uploaded-images", JSON.stringify(next)); } catch {}
      return next;
    });
    setAiStatus("idle");
    setAiGeneratedUrl(null);
    setSidePanel("upload");
  }

  // ── Device switching ───────────────────────────────────────
  function switchDevice(mode: DeviceMode) {
    setDeviceMode(mode);
    if (mode !== "pc") {
      // Persist immediately so iframe can read latest config
      localStorage.setItem("site-config", JSON.stringify(config));
      setPreviewKey((k) => k + 1);
    }
  }

  // ── Active page helpers ────────────────────────────────────
  function getActiveConfig(): SiteConfig {
    if (activePageId === "home") return config;
    const page = config.pages.find((p) => p.id === activePageId);
    // フッターはホームと共通 — サブページのsectionsからフッターを除き、ホームのフッターを末尾に追加
    const homeFooter = config.sections.filter((s) => s.type === "footer");
    const pageSections = (page?.sections ?? []).filter((s) => s.type !== "footer");
    return { ...config, sections: [...pageSections, ...homeFooter] };
  }

  function handleActiveConfigChange(newConfig: SiteConfig) {
    if (activePageId === "home") {
      updateConfig(newConfig);
    } else {
      updateConfig({
        ...newConfig,
        sections: config.sections,
        pages: config.pages.map((p) =>
          p.id === activePageId ? { ...p, sections: newConfig.sections } : p
        ),
      });
    }
  }

  function getActiveSections(): SectionBlock[] {
    if (activePageId === "home") return config.sections;
    // サブページはフッター除外（フッターはホーム共通）
    return (config.pages.find((p) => p.id === activePageId)?.sections ?? []).filter((s) => s.type !== "footer");
  }

  function setActiveSections(sections: SectionBlock[]) {
    if (activePageId === "home") {
      updateConfig({ ...config, sections });
    } else {
      updateConfig({
        ...config,
        pages: config.pages.map((p) =>
          p.id === activePageId ? { ...p, sections } : p
        ),
      });
    }
  }

  // ── Block operations ───────────────────────────────────────
  function deleteSection(id: string) {
    setActiveSections(getActiveSections().filter((s) => s.id !== id));
  }

  function reorderSections(from: number, to: number) {
    const next = [...getActiveSections()];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setActiveSections(next);
    setBlockDragIdx(null);
    setBlockDragOver(null);
  }

  function handleInsertRequest(position: number) {
    setInsertPosition(position);
    setShowBlockModal(true);
  }

  function handleBlockInsert(block: SectionBlock) {
    const sections = getActiveSections();
    const next = [...sections];
    const pos = insertPosition === null ? next.length : insertPosition;
    next.splice(pos, 0, block);
    setActiveSections(next);
    setShowBlockModal(false);
    setInsertPosition(null);
  }

  // ── Page management ────────────────────────────────────────
  const allPageTabs: PageTab[] = [
    { id: "home", slug: "", title: "ホーム", isHome: true },
    ...config.pages.map((p) => ({ id: p.id, slug: p.slug, title: p.title, isHome: false })),
  ];

  function addPage() {
    const newPage: SitePage = {
      id: uid(), slug: `page-${config.pages.length + 1}`,
      title: `新しいページ ${config.pages.length + 1}`, sections: [],
    };
    setConfig({ ...config, pages: [...config.pages, newPage] });
    setActivePageId(newPage.id);
  }

  function deletePage(pageId: string) {
    setConfig({ ...config, pages: config.pages.filter((p) => p.id !== pageId) });
    if (activePageId === pageId) setActivePageId("home");
  }

  function commitRename() {
    if (!renamingPageId || renamingPageId === "home") { setRenamingPageId(null); return; }
    setConfig({
      ...config,
      pages: config.pages.map((p) =>
        p.id === renamingPageId
          ? { ...p, title: renameValue, slug: renameValue.toLowerCase().replace(/[\s　]+/g, "-") }
          : p
      ),
    });
    setRenamingPageId(null);
  }

  // ── Publish ────────────────────────────────────────────────
  async function handlePublish() {
    if (!siteSlug) return;
    setPublishing(true);
    setPublishStatus("idle");
    const { error } = await publishSite(siteSlug, config);
    setPublishing(false);
    if (error) {
      setPublishStatus("error");
      setPublishError(error);
      setTimeout(() => setPublishStatus("idle"), 5000);
    } else {
      setPublishStatus("success");
      setTimeout(() => setPublishStatus("idle"), 4000);
    }
  }

  const publishUrl = typeof window !== "undefined"
    ? `${window.location.origin}/sites/${siteSlug}`
    : `/sites/${siteSlug}`;

  const activeSections = getActiveSections();
  const u = (patch: Partial<SiteConfig>) => updateConfig({ ...config, ...patch });

  // ── Sidebar icons ──────────────────────────────────────────
  const SIDE_ICONS: { id: SidePanel; label: string; icon: React.ReactNode }[] = [
    { id: "settings", label: "設定",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
    { id: "blocks", label: "ブロック",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
    { id: "upload", label: "画像",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
    { id: "ai-image", label: "AI画像",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.09 8.26L2 9.27L7 14.14L5.82 21L12 17.77L18.18 21L17 14.14L22 9.27L14.91 8.26L12 2Z"/></svg> },
    { id: "seo", label: "SEO",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
    { id: "column", label: "コラム",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  ];

  return (
    <EditingContext.Provider value={true}>
    <ImagePickContext.Provider value={{ pickedUrl, pick: setPickedUrl, clear: () => setPickedUrl(null) }}>
      <style>{`
        @media (max-width: 900px) {
          .admin-left-panel { display: none !important; }
          .admin-topbar-slug { display: none !important; }
          .admin-topbar-undo { display: none !important; }
          .admin-topbar-reset { display: none !important; }
          .admin-topbar-collab { display: none !important; }
          .admin-device-switcher { display: none !important; }
          .admin-pagetabs { display: none !important; }
        }
        @media (max-width: 600px) {
          .admin-ai-btn { display: none !important; }
        }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* ─── Top bar ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", height: 48, flexShrink: 0, minWidth: 0, overflow: "hidden" }}>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="4" height="4" rx="1" fill="white" opacity="0.9"/><rect x="7" y="1" width="4" height="4" rx="1" fill="white" opacity="0.6"/><rect x="1" y="7" width="4" height="4" rx="1" fill="white" opacity="0.6"/><rect x="7" y="7" width="4" height="4" rx="1" fill="white" opacity="0.9"/></svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>ツクリエ</span>
          </div>

          <div style={{ width: 1, height: 20, background: "#E2E8F0", flexShrink: 0 }} />

          {/* Page tabs */}
          <div className="admin-pagetabs" style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, overflowX: "auto", minWidth: 0 }}>
            {allPageTabs.map((page) => (
              <div key={page.id} className="relative group/tab flex-shrink-0">
                {renamingPageId === page.id ? (
                  <input autoFocus value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingPageId(null); }}
                    style={{ fontSize: 12, background: "#F8FAFC", color: "#111827", borderRadius: 6, padding: "4px 8px", outline: "none", border: "1.5px solid #4F46E5", width: 100 }} />
                ) : (
                  <button
                    onClick={() => { setActivePageId(page.id); setSidePanel("blocks"); }}
                    onDoubleClick={() => !page.isHome && (setRenamingPageId(page.id), setRenameValue(page.title))}
                    style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", transition: "all 0.12s",
                      background: activePageId === page.id ? "#EEF2FF" : "transparent",
                      color: activePageId === page.id ? "#4F46E5" : "#6B7280",
                      fontWeight: activePageId === page.id ? 600 : 400,
                    }}>
                    <Layout size={10} /> {page.title}
                  </button>
                )}
                {!page.isHome && renamingPageId !== page.id && (
                  <button onClick={() => deletePage(page.id)}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white hidden group-hover/tab:flex items-center justify-center text-[8px] z-10">
                    x
                  </button>
                )}
              </div>
            ))}
            <button onClick={addPage}
              style={{ fontSize: 11, color: "#94A3B8", padding: "4px 8px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#4F46E5"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}>
              <Plus size={10} /> ページ追加
            </button>
          </div>

          {/* Device switcher */}
          <div className="admin-device-switcher" style={{ display: "flex", alignItems: "center", gap: 1, background: "#F1F5F9", borderRadius: 8, padding: 3, flexShrink: 0 }}>
            {([
              { mode: "pc" as DeviceMode, label: "PC",
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
              { mode: "tablet" as DeviceMode, label: "Tab",
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg> },
              { mode: "sp" as DeviceMode, label: "SP",
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg> },
            ] as { mode: DeviceMode; label: string; icon: React.ReactNode }[]).map(({ mode, label, icon }) => (
              <button key={mode} onClick={() => switchDevice(mode)}
                title={mode === "pc" ? "PC表示" : mode === "tablet" ? "タブレット表示 (768px)" : "スマホ表示 (390px)"}
                style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600, transition: "all 0.12s",
                  background: deviceMode === mode ? "#FFFFFF" : "transparent",
                  color: deviceMode === mode ? "#4F46E5" : "#64748B",
                  boxShadow: deviceMode === mode ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div className="admin-topbar-slug" style={{ display: "flex", alignItems: "center", gap: 5, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "4px 10px" }}>
              <Globe size={10} style={{ color: "#94A3B8" }} />
              {editingSlug ? (
                <input autoFocus value={siteSlug}
                  onChange={(e) => setSiteSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
                  onBlur={() => setEditingSlug(false)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingSlug(false); }}
                  style={{ background: "transparent", color: "#111827", fontSize: 11, outline: "none", width: 100, fontFamily: "monospace" }}
                  placeholder="my-site" />
              ) : (
                <button onClick={() => setEditingSlug(true)}
                  style={{ background: "none", border: "none", color: "#374151", fontSize: 11, fontFamily: "monospace", cursor: "pointer", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {siteSlug || "スラッグ設定"}
                </button>
              )}
            </div>
            <a className="admin-topbar-collab" href="/admin/column" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#059669", padding: "5px 10px", borderRadius: 7, border: "1px solid #D1FAE5", background: "#F0FDF4", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>コラム</a>
            <a className="admin-ai-btn" href="/admin/setup" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#7C3AED", padding: "5px 10px", borderRadius: 7, border: "1px solid #DDD6FE", background: "#F5F3FF", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>AI生成</a>
            <button className="admin-topbar-undo" onClick={handleUndo} disabled={undoStack.length === 0}
              title={`元に戻す (${undoStack.length}件)`}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "5px 8px", borderRadius: 7, border: "1px solid #E2E8F0", background: "transparent", cursor: undoStack.length === 0 ? "not-allowed" : "pointer",
                color: undoStack.length === 0 ? "#CBD5E1" : "#4F46E5",
                borderColor: undoStack.length === 0 ? "#F1F5F9" : "#C7D2FE",
              }}>
              <Undo2 size={11} /> 元に戻す
            </button>
            <button className="admin-topbar-reset" onClick={() => { setUndoStack([]); setConfig(defaultConfig); }}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6B7280", padding: "5px 8px", borderRadius: 7, border: "1px solid #E2E8F0", background: "transparent", cursor: "pointer" }}>
              <RefreshCw size={11} /> リセット
            </button>
            <button onClick={handlePublish} disabled={publishing || !siteSlug}
              title={!isSupabaseConfigured ? "Supabase未設定" : undefined}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 8, border: "none", cursor: publishing || !siteSlug ? "not-allowed" : "pointer", opacity: publishing || !siteSlug ? 0.5 : 1, transition: "all 0.15s", whiteSpace: "nowrap",
                background: publishStatus === "success" ? "#059669" : publishStatus === "error" ? "#DC2626" : "#4F46E5", color: "#fff" }}>
              {publishing ? <><span style={{ width: 11, height: 11, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} /> 保存中...</>
                : publishStatus === "success" ? <><Check size={12} /> 公開済み</>
                : publishStatus === "error" ? <><AlertCircle size={12} /> エラー</>
                : <><ExternalLink size={12} /> 保存して公開</>}
            </button>
          </div>
        </div>

        {/* Banners */}
        {publishStatus === "success" && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between shrink-0">
            <p className="text-xs text-green-700 flex items-center gap-1.5"><Check size={12} /> 公開しました！ <span className="font-mono text-green-600">{publishUrl}</span></p>
            <a href={publishUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">サイトを見る <ExternalLink size={10} /></a>
          </div>
        )}
        {publishStatus === "error" && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 shrink-0">
            <p className="text-xs text-red-700 flex items-center gap-1.5"><AlertCircle size={12} /> 公開に失敗しました: {publishError}</p>
          </div>
        )}

        {/* ─── Main layout ─────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

          {/* ═══ Left sidebar (CanvasEditor style) ═══════ */}
          <div style={{ display: "flex", flexShrink: 0, height: "100%" }}>

            {/* Dark icon rail */}
            <div style={{ width: 56, background: "#0F172A", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10, gap: 2, flexShrink: 0 }}>
              {SIDE_ICONS.map((item) => (
                <button key={item.id} onClick={() => setSidePanel(item.id)}
                  style={{ width: 46, padding: "8px 0 6px", border: "none", borderRadius: 8,
                    background: sidePanel === item.id ? "rgba(99,102,241,0.18)" : "transparent",
                    color: sidePanel === item.id ? "#818CF8" : "#475569",
                    cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all 0.15s" }}
                  onMouseEnter={e => { if (sidePanel !== item.id) (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
                  onMouseLeave={e => { if (sidePanel !== item.id) (e.currentTarget as HTMLElement).style.color = "#475569"; }}>
                  {item.icon}
                  <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.02em" }}>{item.label}</span>
                </button>
              ))}
            </div>

            {/* White content panel */}
            <div className="admin-left-panel" style={{ width: 240, background: "#FFFFFF", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
              <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid #F1F5F9", flexShrink: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  {sidePanel === "settings"
                    ? activePageId === "home" ? "サイト全体設定" : "ページ設定"
                    : sidePanel === "blocks" ? "ブロック編集"
                    : sidePanel === "upload" ? "画像ライブラリ"
                    : sidePanel === "ai-image" ? "AI画像生成"
                    : sidePanel === "column" ? "コラム管理"
                    : "SEO / 集客設定"}
                </p>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>

                {/* ── 設定パネル ── */}
                {sidePanel === "settings" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* ── ページ別設定（サブページ選択時） ── */}
                  {activePageId !== "home" && (() => {
                    const activePage = config.pages.find(p => p.id === activePageId);
                    if (!activePage) return null;
                    const updatePage = (patch: Partial<typeof activePage>) => {
                      updateConfig({
                        ...config,
                        pages: config.pages.map(p => p.id === activePageId ? { ...p, ...patch } : p),
                      });
                    };
                    const updatePageSlug = (newSlug: string) => {
                      const sanitized = newSlug.replace(/[^a-z0-9-]/g, "");
                      updateConfig({
                        ...config,
                        pages: config.pages.map(p => p.id === activePageId ? { ...p, slug: sanitized } : p),
                        navLinks: config.navLinks.map(l =>
                          l.url === `/${activePage.slug}` ? { ...l, url: `/${sanitized}` } : l
                        ),
                      });
                    };
                    return (
                      <>
                        <div style={{ padding: "10px", background: "#EEF2FF", borderRadius: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#4F46E5", margin: 0, letterSpacing: "0.05em" }}>ページ情報</p>
                          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>ページタイトル</span>
                            <input value={activePage.title}
                              onChange={e => updatePage({ title: e.target.value })}
                              style={{ fontSize: 12, padding: "7px 10px", border: "1px solid #C7D2FE", borderRadius: 7, outline: "none", color: "#111", background: "#fff" }} />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>URL スラッグ <span style={{ color: "#94A3B8", fontWeight: 400 }}>(英数字・ハイフン)</span></span>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ fontSize: 10, color: "#94A3B8", whiteSpace: "nowrap" }}>/</span>
                              <input value={activePage.slug}
                                onChange={e => updatePageSlug(e.target.value)}
                                style={{ fontSize: 11, padding: "7px 10px", border: "1px solid #C7D2FE", borderRadius: 7, outline: "none", color: "#111", background: "#fff", width: "100%", fontFamily: "monospace" }} />
                            </div>
                          </label>
                        </div>

                        <div style={{ padding: "10px", background: "#F8FAFC", borderRadius: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#475569", margin: 0, letterSpacing: "0.05em" }}>SEO設定（このページ）</p>
                          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>タイトルタグ <span style={{ color: "#94A3B8", fontWeight: 400 }}>(未入力=ページタイトル)</span></span>
                            <input value={activePage.metaTitle ?? ""}
                              onChange={e => updatePage({ metaTitle: e.target.value || undefined })}
                              placeholder={activePage.title}
                              style={{ fontSize: 11, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111", background: "#fff" }} />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>ディスクリプション</span>
                            <textarea value={activePage.metaDescription ?? ""}
                              onChange={e => updatePage({ metaDescription: e.target.value || undefined })}
                              rows={3} placeholder="検索結果に表示される説明文 (120文字以内)"
                              style={{ fontSize: 11, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", resize: "none", color: "#111", lineHeight: 1.6 }} />
                          </label>
                          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>OGP画像URL</span>
                            <input value={activePage.ogImage ?? ""}
                              onChange={e => updatePage({ ogImage: e.target.value || undefined })}
                              placeholder="https://..."
                              style={{ fontSize: 11, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111", background: "#fff" }} />
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                            <input type="checkbox" checked={activePage.noindex ?? false}
                              onChange={e => updatePage({ noindex: e.target.checked || undefined })}
                              style={{ width: 14, height: 14, accentColor: "#4F46E5" }} />
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>検索エンジンにインデックスさせない (noindex)</span>
                          </label>
                        </div>

                        {/* ページプレビューURL */}
                        <div style={{ padding: "8px 10px", background: "#F1F5F9", borderRadius: 7 }}>
                          <p style={{ fontSize: 9, color: "#94A3B8", margin: "0 0 3px", fontWeight: 600 }}>公開URL</p>
                          <p style={{ fontSize: 10, color: "#4F46E5", margin: 0, fontFamily: "monospace", wordBreak: "break-all" }}>
                            /sites/{siteSlug}/{activePage.slug}
                          </p>
                        </div>

                        <div style={{ height: 1, background: "#E2E8F0" }} />
                      </>
                    );
                  })()}

                  {/* サイト全体設定はホームのみ表示（サブページでは折りたたみ） */}
                  {activePageId !== "home" && (
                    <p style={{ fontSize: 10, color: "#94A3B8", margin: 0, textAlign: "center" }}>
                      サイト全体設定は「ホーム」タブで変更できます
                    </p>
                  )}

                  {activePageId === "home" && <>
                    {/* タイトル・ロゴ */}
                    <div style={{ padding: "10px", background: "#F8FAFC", borderRadius: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#475569", margin: 0, letterSpacing: "0.05em" }}>タイトル・ロゴ</p>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>サイト名</span>
                        <input value={config.title} onChange={e => u({ title: e.target.value })}
                          style={{ fontSize: 12, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111", background: "#fff" }} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>ロゴ画像 URL <span style={{ color: "#94A3B8", fontWeight: 400 }}>(任意)</span></span>
                        <input value={config.logoUrl ?? ""} onChange={e => u({ logoUrl: e.target.value || undefined })}
                          placeholder="https://example.com/logo.png"
                          style={{ fontSize: 11, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111", background: "#fff" }} />
                        {config.logoUrl && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 7, padding: "6px 8px" }}>
                            <img src={config.logoUrl} alt="logo preview" style={{ height: 28, maxWidth: 80, objectFit: "contain" }}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                            <span style={{ fontSize: 10, color: "#94A3B8" }}>プレビュー</span>
                            <button onClick={() => u({ logoUrl: undefined })}
                              style={{ marginLeft: "auto", fontSize: 10, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>削除</button>
                          </div>
                        )}
                      </label>
                    </div>

                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>ディスクリプション</span>
                      <textarea value={config.description ?? ""} onChange={e => u({ description: e.target.value })}
                        rows={3} style={{ fontSize: 12, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", resize: "none", color: "#111", lineHeight: 1.6 }}
                        placeholder="検索結果に表示される説明文 (120文字以内)" />
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>メインカラー</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E8F0", borderRadius: 7, padding: "4px 8px" }}>
                          <input type="color" value={config.primaryColor} onChange={e => u({ primaryColor: e.target.value })}
                            style={{ width: 24, height: 24, border: "none", padding: 0, borderRadius: 4, cursor: "pointer" }} />
                          <span style={{ fontSize: 10, color: "#64748B", fontFamily: "monospace" }}>{config.primaryColor}</span>
                        </div>
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>アクセント</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E8F0", borderRadius: 7, padding: "4px 8px" }}>
                          <input type="color" value={config.accentColor} onChange={e => u({ accentColor: e.target.value })}
                            style={{ width: 24, height: 24, border: "none", padding: 0, borderRadius: 4, cursor: "pointer" }} />
                          <span style={{ fontSize: 10, color: "#64748B", fontFamily: "monospace" }}>{config.accentColor}</span>
                        </div>
                      </label>
                    </div>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>フォント</span>
                      <select value={config.siteFont ?? "Noto Sans JP"} onChange={e => u({ siteFont: e.target.value })}
                        style={{ fontSize: 11, padding: "7px 8px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111", background: "#fff", cursor: "pointer" }}>
                        <option value="Noto Sans JP">Noto Sans JP（源ノ角ゴシック）</option>
                        <option value="Noto Serif JP">Noto Serif JP（源ノ明朝）</option>
                        <option value="M PLUS Rounded 1c">M PLUS Rounded 1c（まるもじ）</option>
                        <option value="Zen Kaku Gothic New">Zen Kaku Gothic New（新ゴシック）</option>
                        <option value="Shippori Mincho">Shippori Mincho（しっぽり明朝）</option>
                      </select>
                    </label>
                  </>}
                  </div>
                )}

                {/* ── ブロックパネル ── */}
                {sidePanel === "blocks" && (
                  <div>
                    {/* HTMLモード時の案内 */}
                    {htmlMode && (
                      <div style={{ marginBottom: 14, padding: "10px 12px", background: "#EEF2FF", borderRadius: 8, border: "1px solid #C7D2FE" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#4F46E5", margin: "0 0 4px" }}>✏️ テキストをクリックして編集</p>
                        <p style={{ fontSize: 10, color: "#6366F1", margin: 0, lineHeight: 1.6 }}>右のプレビュー上でテキストを直接クリックすると編集できます。Enterまたはクリック外で確定。</p>
                      </div>
                    )}
                    {/* 配置済みブロック一覧 */}
                    {activeSections.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#64748B", marginBottom: 8, letterSpacing: "0.05em" }}>配置済みブロック（ドラッグで並び替え）</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                          {activeSections.map((section, idx) => {
                            const label = BLOCK_META.find((m) => m.type === section.type)?.label ?? section.type;
                            return (
                              <div key={section.id}>
                                <div
                                  draggable
                                  onDragStart={() => setBlockDragIdx(idx)}
                                  onDragEnd={() => { setBlockDragIdx(null); setBlockDragOver(null); }}
                                  onDragOver={e => { e.preventDefault(); setBlockDragOver(idx); }}
                                  onDragLeave={() => setBlockDragOver(null)}
                                  onDrop={e => { e.preventDefault(); if (blockDragIdx !== null) reorderSections(blockDragIdx, idx); }}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "7px 10px", borderRadius: 8,
                                    border: blockDragOver === idx && blockDragIdx !== idx ? "1.5px solid #4F46E5" : "1px solid #E2E8F0",
                                    background: blockDragIdx === idx ? "#EEF2FF" : "#FAFAFA",
                                    opacity: blockDragIdx === idx ? 0.5 : 1,
                                    cursor: "grab", marginBottom: 2, transition: "all 0.1s",
                                  }}>
                                  <svg width="10" height="14" viewBox="0 0 10 14" fill="#CBD5E1" style={{ flexShrink: 0 }}>
                                    <circle cx="3" cy="2.5" r="1.3"/><circle cx="7" cy="2.5" r="1.3"/>
                                    <circle cx="3" cy="7" r="1.3"/><circle cx="7" cy="7" r="1.3"/>
                                    <circle cx="3" cy="11.5" r="1.3"/><circle cx="7" cy="11.5" r="1.3"/>
                                  </svg>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {label}
                                  </span>
                                  <button onClick={() => deleteSection(section.id)}
                                    style={{ width: 22, height: 22, border: "1px solid #FEE2E2", borderRadius: 5, background: "#FFF5F5", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}
                                    title="ブロックを削除">×</button>
                                </div>
                                {idx < activeSections.length - 1 && (
                                  <button
                                    onClick={() => handleInsertRequest(idx + 1)}
                                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, width: "100%", height: 22, border: "1px dashed #C7D2FE", borderRadius: 6, background: "transparent", cursor: "pointer", color: "#818CF8", fontSize: 13, fontWeight: 700, margin: "2px 0", transition: "all 0.12s" }}
                                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#EEF2FF"; el.style.borderColor = "#818CF8"; }}
                                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.borderColor = "#C7D2FE"; }}>
                                    +
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ height: 1, background: "#F1F5F9", margin: "12px 0" }} />
                      </div>
                    )}

                    {/* フッター共通表示（サブページ） */}
                    {activePageId !== "home" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", marginBottom: 2, opacity: 0.7 }}>
                        <svg width="10" height="14" viewBox="0 0 10 14" fill="#CBD5E1" style={{ flexShrink: 0 }}>
                          <circle cx="3" cy="2.5" r="1.3"/><circle cx="7" cy="2.5" r="1.3"/>
                          <circle cx="3" cy="7" r="1.3"/><circle cx="7" cy="7" r="1.3"/>
                          <circle cx="3" cy="11.5" r="1.3"/><circle cx="7" cy="11.5" r="1.3"/>
                        </svg>
                        <span style={{ fontSize: 10, color: "#94A3B8", flex: 1 }}>フッター（ホームと共通）</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                    )}
                    {/* ブロックを追加 */}
                    <button
                      onClick={() => { setInsertPosition(null); setShowBlockModal(true); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px 0", borderRadius: 8, border: "1.5px dashed #C7D2FE", background: "#EEF2FF", cursor: "pointer", color: "#4F46E5", fontWeight: 700, fontSize: 12, marginBottom: 12, transition: "background 0.12s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#E0E7FF"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#EEF2FF"; }}>
                      <span style={{ fontSize: 15 }}>+</span> ブロックを追加
                    </button>
                  </div>
                )}

                {/* ── 画像アップロードパネル ── */}
                {sidePanel === "upload" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* アップロードボタン */}
                    <input ref={uploadInputRef} type="file" accept="image/*" multiple
                      onChange={handleImageUpload} style={{ display: "none" }} />
                    <button onClick={() => uploadInputRef.current?.click()}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px 0", borderRadius: 8, border: "1.5px dashed #C7D2FE", background: "#EEF2FF", cursor: "pointer", color: "#4F46E5", fontWeight: 700, fontSize: 12, transition: "background 0.12s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#E0E7FF"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#EEF2FF"; }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                      画像をアップロード
                    </button>
                    <p style={{ fontSize: 10, color: "#94A3B8", margin: 0, textAlign: "center" }}>
                      最大3MB / JPG・PNG・WebP対応
                    </p>

                    {uploadedImages.length === 0 ? (
                      <div style={{ padding: "20px 0", textAlign: "center", color: "#CBD5E1", fontSize: 11 }}>
                        まだ画像がありません
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize: 10, fontWeight: 600, color: "#64748B", margin: "4px 0 2px", letterSpacing: "0.05em" }}>
                          アップロード済み ({uploadedImages.length}枚)
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          {uploadedImages.map((img) => (
                            <div key={img.id}
                              draggable
                              onDragStart={e => { e.dataTransfer.setData("text/plain", img.url); e.dataTransfer.effectAllowed = "copy"; setPickedUrl(img.url); setIsDragging(true); dragUrlRef.current = img.url; }}
                              onClick={() => setPickedUrl(pickedUrl === img.url ? null : img.url)}
                              style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: pickedUrl === img.url ? "2.5px solid #4F46E5" : "1px solid #E2E8F0", background: "#F8FAFC", cursor: "grab", boxShadow: pickedUrl === img.url ? "0 0 0 3px #C7D2FE" : "none" }}>
                              {pickedUrl === img.url && (
                                <div style={{ position: "absolute", top: 4, right: 4, zIndex: 10, background: "#4F46E5", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5,5 3.8,7.5 8.5,2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                              )}
                              <img src={img.url} alt={img.name}
                                style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block", pointerEvents: "none" }} />
                              <div style={{ padding: "4px 6px", background: "#fff" }}>
                                <p style={{ fontSize: 9, color: "#64748B", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.name}</p>
                              </div>
                              {/* アクションボタン */}
                              <div style={{ display: "flex", gap: 2, padding: "0 4px 4px", background: "#fff" }}>
                                <button onClick={() => copyImageUrl(img)}
                                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 3, padding: "4px 0", borderRadius: 5, border: "1px solid #E2E8F0", background: copiedId === img.id ? "#D1FAE5" : "#F8FAFC", color: copiedId === img.id ? "#059669" : "#4F46E5", cursor: "pointer", fontSize: 9, fontWeight: 600 }}>
                                  {copiedId === img.id ? "✓ コピー済" : "URLコピー"}
                                </button>
                                <button onClick={() => deleteUploadedImage(img.id)}
                                  style={{ width: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5, border: "1px solid #FEE2E2", background: "#FFF5F5", color: "#EF4444", cursor: "pointer" }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: 10, color: "#94A3B8", textAlign: "center", margin: "4px 0 0" }}>
                          クリック選択 or ドラッグ → プレビューの画像にドロップ
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* ── AI画像生成パネル ── */}
                {sidePanel === "ai-image" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* プロンプト */}
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>どんな画像？（日本語でOK）</span>
                      <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                        rows={3} placeholder={"例：笑顔のビジネスチームが\n会議室で話し合う場面"}
                        onKeyDown={e => { if (e.key === "Enter" && e.metaKey) generateAiImage(); }}
                        style={{ fontSize: 11, padding: "8px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", resize: "none", color: "#111", lineHeight: 1.6 }} />
                    </label>

                    {/* サンプル */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>サンプル</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {["笑顔のビジネスチーム", "モダンオフィスの夜景", "自然の中でPCを開く人", "カフェで仕事する女性"].map(ex => (
                          <button key={ex} onClick={() => setAiPrompt(ex)}
                            style={{ fontSize: 9, padding: "3px 7px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#64748B", cursor: "pointer" }}>
                            {ex}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* スタイル */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>スタイル</span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                        {AI_STYLES.map((s, i) => (
                          <button key={i} onClick={() => setAiStyleIdx(i)}
                            style={{ fontSize: 10, padding: "5px 0", borderRadius: 6, border: `1.5px solid ${aiStyleIdx === i ? config.primaryColor : "#E2E8F0"}`, background: aiStyleIdx === i ? config.primaryColor + "15" : "transparent", color: aiStyleIdx === i ? config.primaryColor : "#64748B", cursor: "pointer", fontWeight: aiStyleIdx === i ? 700 : 400 }}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* サイズ */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>サイズ</span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                        {AI_SIZES.map((s, i) => (
                          <button key={i} onClick={() => setAiSizeIdx(i)}
                            style={{ fontSize: 9, padding: "5px 2px", borderRadius: 6, border: `1.5px solid ${aiSizeIdx === i ? config.accentColor : "#E2E8F0"}`, background: aiSizeIdx === i ? config.accentColor + "20" : "transparent", color: aiSizeIdx === i ? "#374151" : "#64748B", cursor: "pointer", fontWeight: aiSizeIdx === i ? 700 : 400, textAlign: "center" }}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 生成ボタン */}
                    <button onClick={generateAiImage} disabled={!aiPrompt.trim() || aiStatus === "loading"}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: !aiPrompt.trim() || aiStatus === "loading" ? "#E2E8F0" : config.primaryColor, color: !aiPrompt.trim() || aiStatus === "loading" ? "#94A3B8" : "#fff", fontWeight: 700, fontSize: 12, cursor: !aiPrompt.trim() || aiStatus === "loading" ? "not-allowed" : "pointer" }}>
                      {aiStatus === "loading" ? (
                        <><span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid currentColor", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} /> 生成中… (10〜30秒)</>
                      ) : (
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L9.09 8.26L2 9.27L7 14.14L5.82 21L12 17.77L18.18 21L17 14.14L22 9.27L14.91 8.26L12 2Z" fill="currentColor"/></svg> 画像を生成</>
                      )}
                    </button>

                    {/* 生成中プログレスバー */}
                    {aiStatus === "loading" && (
                      <div style={{ height: 3, background: "#F1F5F9", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: config.accentColor, borderRadius: 2, animation: "ai-progress 1.5s ease-in-out infinite", width: "40%" }} />
                        <style>{`@keyframes ai-progress{0%{transform:translateX(-100%);width:40%}50%{width:60%}100%{transform:translateX(300%);width:40%}}`}</style>
                      </div>
                    )}

                    {/* 生成結果 */}
                    {aiStatus === "done" && aiGeneratedUrl && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <img src={aiGeneratedUrl} alt="generated" style={{ width: "100%", borderRadius: 8, display: "block", border: "1px solid #E2E8F0" }} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6 }}>
                          <button onClick={saveAiImageToLibrary}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 7, border: "none", background: "#059669", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            ライブラリに保存
                          </button>
                          <button onClick={generateAiImage}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 10px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#64748B", fontSize: 10, cursor: "pointer" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                            再生成
                          </button>
                        </div>
                        <p style={{ fontSize: 9, color: "#94A3B8", textAlign: "center", margin: 0 }}>
                          保存後→「画像」タブからドラッグ&ドロップで設定
                        </p>
                      </div>
                    )}

                    {/* エラー */}
                    {aiStatus === "error" && (
                      <div style={{ padding: 10, background: "#FEF2F2", borderRadius: 8 }}>
                        <p style={{ fontSize: 11, color: "#DC2626", margin: "0 0 6px" }}>生成に失敗しました。</p>
                        <button onClick={generateAiImage}
                          style={{ fontSize: 10, color: "#DC2626", border: "1px solid #FECACA", borderRadius: 5, padding: "4px 10px", background: "#fff", cursor: "pointer" }}>
                          再試行
                        </button>
                      </div>
                    )}

                    <p style={{ fontSize: 9, color: "#CBD5E1", textAlign: "center", margin: 0 }}>
                      Powered by Pollinations AI · 無料・APIキー不要
                    </p>
                  </div>
                )}

                {/* ── SEOパネル ── */}
                {sidePanel === "seo" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>OGP 画像 URL</span>
                      <input value={config.ogImage ?? ""} onChange={e => u({ ogImage: e.target.value })}
                        style={{ fontSize: 11, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111" }}
                        placeholder="https://..." />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>ファビコン URL</span>
                      <input value={config.favicon ?? ""} onChange={e => u({ favicon: e.target.value })}
                        style={{ fontSize: 11, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111" }}
                        placeholder="https://..." />
                    </label>
                  </div>
                )}

                {/* ── コラム管理パネル ── */}
                {sidePanel === "column" && (
                  <ColumnPanel
                    articles={config.articles}
                    onChange={(articles) => updateConfig({ ...config, articles })}
                  />
                )}

              </div>
            </div>
          </div>

          {/* ═══ Center: SitePreview / Device Preview ════ */}
          {htmlMode && htmlBlobUrl && activePageId === "home" ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* 編集ヒントバー */}
              <div style={{ background: "#4F46E5", padding: "6px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span style={{ color: "white", fontSize: 11, fontWeight: 600 }}>編集モード</span>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>テキストをクリックして直接編集できます</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      if (!htmlUndoStackRef.current.length) return;
                      const prev = htmlUndoStackRef.current.pop()!;
                      setHtmlUndoCount(htmlUndoStackRef.current.length);
                      setSiteHtml(prev);
                      latestHtmlRef.current = prev;
                      try { sessionStorage.setItem("site-html", prev); } catch {}
                    }}
                    disabled={htmlUndoCount === 0}
                    style={{ fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.4)", background: "transparent", color: htmlUndoCount === 0 ? "rgba(255,255,255,0.35)" : "white", cursor: htmlUndoCount === 0 ? "not-allowed" : "pointer" }}>
                    ↩ 元に戻す
                  </button>
                  <button
                    onClick={() => {
                      const cleanHtml = latestHtmlRef.current || siteHtml;
                      const blob = new Blob([cleanHtml], { type: "text/html" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "site.html";
                      a.click();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }}
                    style={{ fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.4)", background: "transparent", color: "white", cursor: "pointer" }}>
                    ↓ ダウンロード
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                <iframe
                  ref={htmlIframeRef}
                  key={htmlBlobUrl}
                  src={htmlBlobUrl}
                  style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                  title="サイトプレビュー（クリックして編集）"
                />
                {/* ドラッグ中のみ表示するオーバーレイ（クロスiframe DnDに必須） */}
                {isDragging && (
                  <div
                    style={{ position: "absolute", inset: 0, zIndex: 20, background: "rgba(79,70,229,0.10)", border: "3px dashed #4F46E5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "copy", transition: "background 0.15s" }}
                    onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                    onDrop={e => {
                      e.preventDefault();
                      const url = dragUrlRef.current || e.dataTransfer.getData("text/plain");
                      if (!url || !htmlIframeRef.current) return;
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      // elementFromPoint はビューポート座標（スクロール加算不要）
                      htmlIframeRef.current.contentWindow?.postMessage(
                        { type: "drop-image", url, x: e.clientX - rect.left, y: e.clientY - rect.top }, "*"
                      );
                      setPickedUrl(null);
                      setIsDragging(false);
                      dragUrlRef.current = "";
                    }}
                  >
                    <div style={{ background: "white", borderRadius: 14, padding: "18px 28px", textAlign: "center", boxShadow: "0 8px 32px rgba(79,70,229,0.18)", pointerEvents: "none" }}>
                      <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#4F46E5", margin: "0 0 4px" }}>ここにドロップ</p>
                      <p style={{ fontSize: 11, color: "#6366F1", margin: 0 }}>配置したい画像エリアの上に落とす</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : deviceMode === "pc" ? (
            <SitePreview
              config={getActiveConfig()}
              onConfigChange={handleActiveConfigChange}
              onInsertRequest={handleInsertRequest}
            />
          ) : (
            <div style={{ flex: 1, overflowY: "auto", background: "#E2E8F0", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20, paddingBottom: 20, gap: 12 }}>
              {/* Refresh hint bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 11, color: "#64748B", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <span>{deviceMode === "sp" ? "スマホ (390px)" : "タブレット (768px)"}</span>
                <button onClick={() => { localStorage.setItem("site-config", JSON.stringify(config)); setPreviewKey((k) => k + 1); }}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 5, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#4F46E5", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                  <RefreshCw size={10} /> 更新
                </button>
              </div>
              {/* Device frame */}
              <div style={{
                width: deviceMode === "sp" ? 390 : 768,
                background: "#fff",
                borderRadius: deviceMode === "sp" ? 36 : 12,
                boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
                overflow: "hidden",
                border: deviceMode === "sp" ? "8px solid #1E293B" : "6px solid #1E293B",
                flexShrink: 0,
              }}>
                <iframe
                  key={previewKey}
                  src="/"
                  style={{ width: "100%", height: deviceMode === "sp" ? 760 : 1000, border: "none", display: "block" }}
                  title="デバイスプレビュー"
                />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 画像選択中バナー */}
      {pickedUrl && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#4F46E5", color: "#fff", borderRadius: 999, padding: "10px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(79,70,229,0.4)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12,8 12,12 14,14"/></svg>
          画像を選択中 — 配置したい画像エリアをクリック
          <button onClick={() => setPickedUrl(null)} style={{ marginLeft: 6, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 20, height: 20, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>×</button>
        </div>
      )}

      {/* Block insert modal */}
      {showBlockModal && (
        <BlockInsertModal
          onInsert={handleBlockInsert}
          onClose={() => { setShowBlockModal(false); setInsertPosition(null); }}
        />
      )}
    </ImagePickContext.Provider>
    </EditingContext.Provider>
  );
}

// ─── コラム管理パネル ──────────────────────────────────────────
function ColumnPanel({ articles, onChange }: { articles: Article[]; onChange: (a: Article[]) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  function startNew() {
    const a: Article = {
      id: uid(), slug: "", title: "新しい記事", date: new Date().toISOString().slice(0, 10),
      category: "コラム", author: "", excerpt: "", body: "", imageUrl: "", published: false,
    };
    onChange([...articles, a]);
    setEditingId(a.id);
  }

  function deleteArticle(id: string) {
    if (!confirm("この記事を削除しますか？")) return;
    onChange(articles.filter((a) => a.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function togglePublished(id: string) {
    onChange(articles.map((a) => a.id === id ? { ...a, published: !a.published } : a));
  }

  const editingArticle = articles.find((a) => a.id === editingId) ?? null;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={startNew}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "9px 0", borderRadius: 8, border: "1.5px dashed #C7D2FE", background: "#EEF2FF", cursor: "pointer", color: "#4F46E5", fontWeight: 700, fontSize: 11 }}>
          <span style={{ fontSize: 14 }}>+</span> 記事を追加
        </button>

        {articles.length === 0 && (
          <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", padding: "16px 0" }}>記事がありません</p>
        )}

        {articles.map((a) => (
          <div key={a.id} style={{ border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", background: "#FAFAFA" }}>
              <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setEditingId(a.id)}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#1E293B", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</p>
                <p style={{ fontSize: 9, color: "#94A3B8", margin: 0 }}>{a.date} · {a.category}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); togglePublished(a.id); }}
                style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, border: "none", cursor: "pointer", flexShrink: 0,
                  background: a.published ? "#DCFCE7" : "#F1F5F9", color: a.published ? "#16A34A" : "#94A3B8", fontWeight: 700 }}>
                {a.published ? "公開中" : "下書き"}
              </button>
              <button onClick={() => setEditingId(a.id)}
                style={{ width: 20, height: 20, border: "1px solid #DBEAFE", borderRadius: 4, background: "#EFF6FF", color: "#3B82F6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}
                title="編集">✏</button>
              <button onClick={() => deleteArticle(a.id)}
                style={{ width: 20, height: 20, border: "1px solid #FEE2E2", borderRadius: 4, background: "#FFF5F5", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>×</button>
            </div>
          </div>
        ))}
      </div>

      {/* 全画面編集モーダル */}
      {editingArticle && (
        <ArticleEditModal
          article={editingArticle}
          onSave={(updated) => {
            onChange(articles.map((a) => a.id === updated.id ? updated : a));
            setEditingId(null);
          }}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  );
}

// ─── 記事全画面エディタ ────────────────────────────────────────
function ArticleEditModal({ article, onSave, onClose }: {
  article: Article;
  onSave: (a: Article) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Article>({ ...article });
  const f = (patch: Partial<Article>) => setForm((prev) => ({ ...prev, ...patch }));

  const inp: React.CSSProperties = { fontSize: 13, padding: "8px 11px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111", width: "100%", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#475569", display: "block", marginBottom: 4 };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "stretch", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1100, background: "#fff", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", margin: "auto" }}>

        {/* ── ヘッダー ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 24px", borderBottom: "1px solid #E2E8F0", background: "#0F172A", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0", flex: 1 }}>記事編集</span>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginRight: 8 }}>
            <span style={{ fontSize: 11, color: form.published ? "#4ADE80" : "#94A3B8", fontWeight: 600 }}>
              {form.published ? "公開中" : "下書き"}
            </span>
            <div onClick={() => f({ published: !form.published })}
              style={{ width: 36, height: 20, borderRadius: 10, background: form.published ? "#22C55E" : "#475569", position: "relative", cursor: "pointer", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 2, left: form.published ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </div>
          </label>
          <button onClick={() => { onSave(form); }}
            style={{ padding: "7px 20px", borderRadius: 7, border: "none", background: "#4F46E5", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            保存
          </button>
          <button onClick={onClose}
            style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #334155", background: "transparent", color: "#94A3B8", fontSize: 12, cursor: "pointer" }}>
            閉じる
          </button>
        </div>

        {/* ── 本体 ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0, maxHeight: "calc(100vh - 60px)" }}>

          {/* 左: メタデータ */}
          <div style={{ width: 320, flexShrink: 0, borderRight: "1px solid #E2E8F0", padding: "20px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={lbl}>タイトル</label>
              <input style={inp} value={form.title} onChange={e => f({ title: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>日付</label>
                <input style={inp} type="date" value={form.date} onChange={e => f({ date: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>カテゴリ</label>
                <input style={inp} value={form.category} onChange={e => f({ category: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={lbl}>スラッグ（URL）</label>
              <input style={inp} value={form.slug} onChange={e => f({ slug: e.target.value })} placeholder="my-article" />
            </div>
            <div>
              <label style={lbl}>著者</label>
              <input style={inp} value={form.author} onChange={e => f({ author: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>アイキャッチ画像 URL</label>
              <input style={inp} value={form.imageUrl} onChange={e => f({ imageUrl: e.target.value })} placeholder="https://..." />
              {form.imageUrl && (
                <img src={form.imageUrl} alt="" style={{ marginTop: 8, width: "100%", height: 120, objectFit: "cover", borderRadius: 6, border: "1px solid #E2E8F0" }} />
              )}
            </div>
            <div>
              <label style={lbl}>抜粋（一覧表示用）</label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 80, fontSize: 12 }} value={form.excerpt} onChange={e => f({ excerpt: e.target.value })} />
            </div>
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#64748B", marginBottom: 10, letterSpacing: "0.05em" }}>SEO設定</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ ...lbl, fontSize: 10 }}>metaタイトル（空欄=タイトルを使用）</label>
                  <input style={{ ...inp, fontSize: 11 }} value={form.metaTitle ?? ""} onChange={e => f({ metaTitle: e.target.value })} />
                </div>
                <div>
                  <label style={{ ...lbl, fontSize: 10 }}>meta説明文</label>
                  <textarea style={{ ...inp, resize: "vertical", minHeight: 56, fontSize: 11 }} value={form.metaDescription ?? ""} onChange={e => f({ metaDescription: e.target.value })} />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.noindex ?? false} onChange={e => f({ noindex: e.target.checked })} />
                  <span style={{ fontSize: 11, color: "#475569" }}>検索エンジンにインデックスさせない</span>
                </label>
              </div>
            </div>
          </div>

          {/* 右: 本文エディタ */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "10px 20px", borderBottom: "1px solid #F1F5F9", flexShrink: 0, background: "#FAFAFA" }}>
              <p style={{ margin: 0, fontSize: 11, color: "#64748B" }}>
                本文（HTML可）— &lt;h2&gt;、&lt;p&gt;、&lt;ul&gt;、&lt;strong&gt; などのタグが使えます
              </p>
            </div>
            <textarea
              style={{ flex: 1, resize: "none", border: "none", outline: "none", padding: "20px 24px", fontSize: 14, lineHeight: 1.8, color: "#1E293B", fontFamily: "'Noto Sans JP', sans-serif", background: "#fff" }}
              value={form.body}
              onChange={e => f({ body: e.target.value })}
              placeholder="<p>ここに本文を入力...</p>&#10;<h2>見出し</h2>&#10;<p>続きの文章</p>"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
