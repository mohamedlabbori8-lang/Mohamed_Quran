const API = "https://api.alquran.cloud/v1";
const $ = (id) => document.getElementById(id);
let surahs = [], currentAyahs = [], currentSurah = 1;
const reciters = {
  "ar.abdulbasitmurattal":"عبد الباسط عبد الصمد",
  "ar.alafasy":"مشاري العفاسي",
  "ar.mahermuaiqly":"ماهر المعيقلي",
  "ar.abdurrahmaansudais":"عبد الرحمن السديس"
};
const dhikr = {
 morning:[
  ["أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ","مرة واحدة"],
  ["اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ","مرة واحدة"],
  ["سُبْحَانَ اللَّهِ وَبِحَمْدِهِ","100 مرة"]
 ],
 evening:[
  ["أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ","مرة واحدة"],
  ["اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ","مرة واحدة"],
  ["أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ","100 مرة"]
 ],
 prayer:[
  ["أَسْتَغْفِرُ اللَّهَ","3 مرات"],
  ["اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ","مرة واحدة"],
  ["سُبْحَانَ اللَّهِ","33 مرة"]
 ],
 dua:[
  ["رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ","البقرة: 201"],
  ["رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً","آل عمران: 8"],
  ["رَبِّ زِدْنِي عِلْمًا","طه: 114"]
 ]
};
async function api(path){
 const response=await fetch(`${API}${path}`);
 if(!response.ok) throw new Error("تعذر الاتصال بمصدر البيانات");
 const json=await response.json();
 if(json.code!==200) throw new Error(json.status||"حدث خطأ");
 return json.data;
}
function showError(container,message){container.innerHTML=`<p class="loading">${message}</p>`}
async function init(){
 $("year").textContent=new Date().getFullYear();
 try{
  surahs=await api("/surah");
  const options=surahs.map(s=>`<option value="${s.number}">${s.number}. ${s.name} — ${s.englishName}</option>`).join("");
  $("surahSelect").innerHTML=options;$("audioSurahSelect").innerHTML=options;
  const saved=JSON.parse(localStorage.getItem("mq-bookmark")||"null");
  await loadSurah(saved?.surah||1,saved?.ayah||1);
 }catch(e){showError($("ayahList"),e.message+" — تحقق من اتصال الإنترنت.");}
}
async function loadSurah(number,ayah=1){
 currentSurah=Number(number);$("surahSelect").value=currentSurah;
 $("ayahList").innerHTML='<p class="loading">جارٍ تحميل السورة...</p>';
 try{
  const data=await api(`/surah/${currentSurah}/quran-uthmani`);
  currentAyahs=data.ayahs;
  $("surahHeading").textContent=data.name;
  $("ayahInput").max=data.numberOfAyahs;$("ayahInput").value=ayah;
  $("ayahList").innerHTML=currentAyahs.map(a=>`
   <article class="ayah-card ${a.numberInSurah===Number(ayah)?"selected":""}" id="ayah-${a.numberInSurah}">
    <div class="ayah-text">${a.text} <span class="ayah-number">${a.numberInSurah}</span></div>
    <div class="ayah-tools">
     <button class="small-btn" data-play="${a.number}">▶ استمع للآية</button>
     <button class="small-btn" data-tafsir="${a.number}">التفسير الميسّر</button>
     <button class="small-btn" data-bookmark="${a.numberInSurah}">حفظ الموضع</button>
    </div><div class="tafsir" id="tafsir-${a.number}">اضغط لعرض التفسير.</div>
   </article>`).join("");
  $("ayahList").insertAdjacentHTML("beforeend", '<div class="surah-dua">ادعوا لي أن تنجح أخواتي في البكالوريا 🤲</div>');
  $("ayahList").querySelectorAll("[data-play]").forEach(b=>b.addEventListener("click",()=>playAyah(Number(b.dataset.play))));
  $("ayahList").querySelectorAll("[data-tafsir]").forEach(b=>b.addEventListener("click",()=>toggleTafsir(Number(b.dataset.tafsir))));
  $("ayahList").querySelectorAll("[data-bookmark]").forEach(b=>b.addEventListener("click",()=>saveBookmark(currentSurah,Number(b.dataset.bookmark))));
  if(ayah>1) setTimeout(()=>document.getElementById(`ayah-${ayah}`)?.scrollIntoView({behavior:"smooth",block:"center"}),100);
 }catch(e){showError($("ayahList"),e.message);}
}
async function toggleTafsir(globalAyah){
 const box=$(`tafsir-${globalAyah}`);box.classList.toggle("show");
 if(box.dataset.loaded)return;
 box.textContent="جارٍ تحميل التفسير...";
 try{const d=await api(`/ayah/${globalAyah}/ar.muyassar`);box.textContent=d.text;box.dataset.loaded="1";}
 catch(e){box.textContent="لم يتوفر التفسير من المصدر حالياً. يمكنك المحاولة لاحقاً.";}
}
function saveBookmark(surah,ayah){
 localStorage.setItem("mq-bookmark",JSON.stringify({surah,ayah}));
 $("bookmarkButton").innerHTML=`↩ <span>متابعة: ${surahs[surah-1]?.name||"السورة"} — آية ${ayah}</span>`;
}
function refreshBookmark(){
 const b=JSON.parse(localStorage.getItem("mq-bookmark")||"null");
 if(b&&surahs.length)$("bookmarkButton").innerHTML=`↩ <span>متابعة: ${surahs[b.surah-1]?.name||"السورة"} — آية ${b.ayah}</span>`;
}
function audioUrl(edition,globalNumber){return `https://cdn.islamic.network/quran/audio/128/${edition}/${globalNumber}.mp3`;}
function setAudio(url,title,subtitle){
 const player=$("audioPlayer");player.src=url;$("playerTitle").textContent=title;$("playerSubtitle").textContent=subtitle;
 player.play().catch(()=>{});
 document.querySelector(".player").scrollIntoView({behavior:"smooth",block:"center"});
}
function playAyah(number){
 const edition=$("reciterSelect").value;
 setAudio(audioUrl(edition,number),reciters[edition],`تشغيل الآية رقم ${number}`);
}
$("playSurah").addEventListener("click",()=>{
 const edition=$("reciterSelect").value,number=Number($("audioSurahSelect").value);
 setAudio(`https://cdn.islamic.network/quran/audio-surah/128/${edition}/${number}.mp3`,reciters[edition],surahs[number-1]?.name||"تلاوة قرآنية");
});
$("backAudio").onclick=()=>{$("audioPlayer").currentTime=Math.max(0,$("audioPlayer").currentTime-10)};
$("forwardAudio").onclick=()=>{$("audioPlayer").currentTime=Math.min($("audioPlayer").duration||Infinity,$("audioPlayer").currentTime+10)};
$("goAyah").onclick=()=>{const n=Number($("ayahInput").value);if(n>=1&&n<=currentAyahs.length){saveBookmark(currentSurah,n);loadSurah(currentSurah,n)}};
$("surahSelect").onchange=e=>loadSurah(Number(e.target.value),1);
$("bookmarkButton").onclick=()=>{const b=JSON.parse(localStorage.getItem("mq-bookmark")||"null");if(b)loadSurah(b.surah,b.ayah);else document.getElementById("quran").scrollIntoView({behavior:"smooth"})};
async function searchQuran(){
 const word=$("searchInput").value.trim();if(!word)return;
 $("searchResults").innerHTML='<p class="loading">جارٍ البحث...</p>';
 try{
  const data=await api(`/search/${encodeURIComponent(word)}/all/ar`);
  if(!data.matches.length){$("searchResults").innerHTML='<p class="loading">لم يتم العثور على نتائج.</p>';return;}
  $("searchResults").innerHTML=data.matches.slice(0,40).map(m=>`<article class="result-card" data-surah="${m.surah.number}" data-ayah="${m.numberInSurah}"><span class="result-meta">${m.surah.name} — الآية ${m.numberInSurah}</span><p>${m.text}</p></article>`).join("");
  $("searchResults").querySelectorAll("[data-surah]").forEach(card=>card.onclick=()=>{loadSurah(Number(card.dataset.surah),Number(card.dataset.ayah));document.getElementById("quran").scrollIntoView({behavior:"smooth"})});
 }catch(e){showError($("searchResults"),"تعذر إتمام البحث. حاول مرة أخرى.");}
}
$("searchButton").onclick=searchQuran;
$("searchInput").addEventListener("keydown",e=>{if(e.key==="Enter")searchQuran()});
function renderDhikr(category){
 $("dhikrList").innerHTML=dhikr[category].map((item,i)=>`<article class="dhikr-card"><div class="dhikr-text">${item[0]}</div><div class="dhikr-bottom"><span>${item[1]}</span><button class="count-btn" data-count="${i}" data-max="${parseInt(item[1])||1}">0</button></div></article>`).join("");
 $("dhikrList").querySelectorAll(".count-btn").forEach(btn=>btn.onclick=()=>{let n=Number(btn.textContent)+1;btn.textContent=n;if(n>=Number(btn.dataset.max))btn.disabled=true;});
}
$("dhikrTabs").querySelectorAll("button").forEach(btn=>btn.onclick=()=>{
 $("dhikrTabs").querySelectorAll("button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");renderDhikr(btn.dataset.category);
});
$("themeToggle").onclick=()=>{document.body.classList.toggle("dark");const dark=document.body.classList.contains("dark");localStorage.setItem("mq-theme",dark?"dark":"light");$("themeToggle").textContent=dark?"☀":"☾"};
if(localStorage.getItem("mq-theme")==="dark"){document.body.classList.add("dark");$("themeToggle").textContent="☀"}
$("menuToggle").onclick=()=>$("navLinks").classList.toggle("open");
$("navLinks").querySelectorAll("a").forEach(a=>a.onclick=()=>$("navLinks").classList.remove("open"));
renderDhikr("morning");
init().then(refreshBookmark);
