(function(){
var ZIPS=(window.ETERNAHOT&&window.ETERNAHOT.ZIPS)||{};
var isSoCal=window.ETERNAHOT&&window.ETERNAHOT.isSoCal||function(){return false};
var step=0,max=4;
var form=document.getElementById("quoteForm");
var steps=[].slice.call(document.querySelectorAll(".step"));
var bar=[].slice.call(document.getElementById("stepBar").children);
var btnBack=document.getElementById("btnBack");
var btnNext=document.getElementById("btnNext");
var zipInput=document.getElementById("zip");
var zipStatus=document.getElementById("zipStatus");

function showErr(el,msg){
  if(!el) return;
  el.className="status show bad";
  el.textContent=msg||"";
}
function hideErr(el){
  if(!el) return;
  el.className="status";
  el.textContent="";
}
function mark(id,on){
  var f=document.getElementById(id);
  if(f) f.classList.toggle("invalid",!!on);
}

function showStep(n){
  step=n;
  steps.forEach(function(s){s.classList.toggle("hidden",Number(s.getAttribute("data-step"))!==n);});
  bar.forEach(function(b,i){b.classList.toggle("on",i<=n);});
  btnBack.disabled=n===0;
  btnNext.textContent=n===max?"Submit request":"Continue";
}

function checkZip(){
  var z=(zipInput.value||"").replace(/\D/g,"").slice(0,5);
  zipInput.value=z;
  if(z.length!==5){
    zipStatus.className="status";
    zipStatus.textContent="";
    document.getElementById("f-coverage").value="";
    document.getElementById("f-neighborhood").value="";
    return false;
  }
  var named=ZIPS[z];
  if(named){
    zipStatus.className="status show ok";
    zipStatus.textContent="Southern California — "+named+". We'll quote this job.";
    document.getElementById("f-coverage").value="socal";
    document.getElementById("f-neighborhood").value=named;
    return true;
  }
  if(isSoCal(z)){
    zipStatus.className="status show ok";
    zipStatus.textContent="Southern California — we'll quote this job.";
    document.getElementById("f-coverage").value="socal";
    document.getElementById("f-neighborhood").value="";
    return true;
  }
  zipStatus.className="status show ok";
  zipStatus.textContent="We'll confirm this address and follow up.";
  document.getElementById("f-coverage").value="other";
  document.getElementById("f-neighborhood").value="";
  return true;
}

zipInput.addEventListener("input",checkZip);
["street","city","zip","name","email","phone"].forEach(function(id){
  var el=document.getElementById(id);
  if(!el) return;
  el.addEventListener("input",function(){
    var f=el.closest(".field");
    if(f) f.classList.remove("invalid");
  });
});

var params=new URLSearchParams(location.search);
if(params.get("zip")){
  zipInput.value=params.get("zip").replace(/\D/g,"").slice(0,5);
  checkZip();
}

document.querySelectorAll(".choice[data-group]").forEach(function(btn){
  btn.addEventListener("click",function(){
    var g=btn.getAttribute("data-group"),v=btn.getAttribute("data-val");
    document.querySelectorAll('.choice[data-group="'+g+'"]').forEach(function(b){b.classList.toggle("on",b===btn);});
    if(g==="project") document.getElementById("f-project").value=v;
    if(g==="gas") document.getElementById("f-gas").value=v;
    if(g==="urgency") document.getElementById("f-urgency").value=v;
    hideErr(document.getElementById("projectErr"));
  });
});

document.querySelectorAll(".toggle").forEach(function(t){
  t.addEventListener("click",function(){
    t.classList.toggle("on");
    document.getElementById(t.getAttribute("data-field")).value=t.classList.contains("on")?"yes":"no";
    updateFitWarn();
  });
});

function updateFitWarn(){
  var w=document.getElementById("fitWarn");
  var home=document.getElementById("f-homeowner").value==="yes";
  var sched=document.getElementById("f-schedule-ok").value==="yes";
  if(!home||!sched){
    w.className="status show bad";
    w.textContent=!home?"We only book with the homeowner or authorized decision-maker.":"We schedule by appointment.";
    return false;
  }
  w.className="status";
  w.textContent="";
  return true;
}

function buildSlots(){
  var box=document.getElementById("slotList");
  box.innerHTML="";
  var none=document.createElement("button");
  none.type="button";
  none.className="slot on";
  none.innerHTML="<b>No preference yet</b><small>We'll confirm a date</small>";
  none.onclick=function(){
    document.getElementById("f-preferred").value="";
    box.querySelectorAll(".slot").forEach(function(s){s.classList.remove("on");});
    none.classList.add("on");
  };
  box.appendChild(none);
  var d=new Date(),added=0;
  for(var i=1;i<21&&added<8;i++){
    var cur=new Date(d.getFullYear(),d.getMonth(),d.getDate()+i);
    var iso=cur.toISOString().slice(0,10);
    var label=cur.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});
    (function(iso,label){
      var b=document.createElement("button");
      b.type="button";
      b.className="slot";
      b.innerHTML="<b>"+label+"</b><small>Preferred — we'll confirm</small>";
      b.onclick=function(){
        document.getElementById("f-preferred").value=iso;
        box.querySelectorAll(".slot").forEach(function(s){s.classList.remove("on");});
        b.classList.add("on");
      };
      box.appendChild(b);
      added++;
    })(iso,label);
  }
}
buildSlots();

function canAdvance(){
  if(step===0){
    var street=document.getElementById("street").value.trim();
    var city=document.getElementById("city").value.trim();
    var z=(zipInput.value||"").replace(/\D/g,"");
    var ok=true;
    mark("fStreet",street.length<4);
    mark("fCity",city.length<2);
    mark("fZip",z.length!==5);
    if(street.length<4){ showErr(zipStatus,"Add a street address."); ok=false; }
    else if(city.length<2){ showErr(zipStatus,"Add a city."); ok=false; }
    else if(z.length!==5){ showErr(zipStatus,"Enter a 5-digit ZIP."); ok=false; }
    else { checkZip(); }
    return ok && z.length===5 && street.length>=4 && city.length>=2;
  }
  if(step===1){
    var proj=document.getElementById("f-project").value;
    var gas=document.getElementById("f-gas").value;
    var err=document.getElementById("projectErr");
    if(!proj){ showErr(err,"Pick the type of job."); return false; }
    if(!gas){ showErr(err,"Tell us if gas is available."); return false; }
    hideErr(err);
    return true;
  }
  if(step===2){
    return updateFitWarn();
  }
  if(step===3){
    var name=document.getElementById("name").value.trim();
    var email=document.getElementById("email").value.trim();
    var phone=(document.getElementById("phone").value||"").replace(/\D/g,"");
    var err=document.getElementById("contactErr");
    mark("fName",name.length<2);
    mark("fEmail",email.indexOf("@")<1);
    mark("fPhone",phone.length<10);
    if(name.length<2){ showErr(err,"Add your name."); return false; }
    if(email.indexOf("@")<1){ showErr(err,"Add a valid email."); return false; }
    if(phone.length<10){ showErr(err,"Add a 10-digit phone number."); return false; }
    hideErr(err);
    return true;
  }
  return true;
}

btnBack.onclick=function(){if(step>0) showStep(step-1);};
btnNext.onclick=function(){
  if(!canAdvance()) return;
  if(step<max){showStep(step+1);return;}
  btnNext.disabled=true;
  btnNext.textContent="Submitting…";
  location.href="check-thanks.html";
};
form.addEventListener("submit",function(e){
  e.preventDefault();
  btnNext.click();
});
showStep(0);
})();
