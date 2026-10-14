(() => {
"use strict";

function fmt(n){
  if(!Number.isFinite(n)) return String(n);
  if(Math.abs(n)>=10000 || (Math.abs(n)>0 && Math.abs(n)<0.001))
    return n.toExponential(4);
  return Number(n.toFixed(5)).toString();
}

function steps(items){
  return items.map(([title,text])=>`
    <div class="is-step">
      <strong>${title}</strong>
      <div>${text}</div>
    </div>
  `).join("");
}

function mountSolver(title, problems){
  const css=document.createElement("style");
  css.textContent=`
  #independent-solver{
   max-width:1100px;margin:30px auto;padding:22px;
   background:#0f172a;color:#f8fafc;border:1px solid #475569;
   border-radius:20px;font-family:system-ui,-apple-system,sans-serif
  }
  #independent-solver .is-fields{
   display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));
   gap:10px
  }
  #independent-solver input,#independent-solver select{
   width:100%;padding:11px;border-radius:9px;border:1px solid #64748b;
   font:inherit;margin:4px 0 10px
  }
  #independent-solver label{display:block;font-weight:750}
  #independent-solver button{
   padding:12px 16px;border:0;border-radius:10px;background:#4ade80;
   color:#052e16;font-weight:850;cursor:pointer;margin-top:10px
  }
  #independent-solver .is-output{
   margin-top:18px;background:#020617;border-radius:14px;padding:16px
  }
  #independent-solver .is-step{
   padding:12px 0;border-bottom:1px solid #334155
  }
  #independent-solver .is-step strong{
   display:block;color:#7dd3fc;margin-bottom:5px
  }
  `;

  document.head.appendChild(css);

  const root=document.createElement("section");
  root.id="independent-solver";

  root.innerHTML=`
    <div style="color:#7dd3fc;font-weight:900">INDEPENDENT SOLVER LAB</div>
    <h2>${title}</h2>
    <p>
      This solver is separate from quizzes.
      It explains the logic, equation choice, algebra, substitution,
      answer, units, and a final sanity check.
    </p>

    <label>Problem type</label>
    <select id="is-type"></select>

    <div class="is-fields" id="is-fields"></div>

    <button id="is-go">Explain + Solve</button>

    <div class="is-output" id="is-output">
      Choose a problem type and enter the givens.
    </div>
  `;

  document.body.appendChild(root);

  const type=root.querySelector("#is-type");
  const fields=root.querySelector("#is-fields");
  const output=root.querySelector("#is-output");

  Object.entries(problems).forEach(([key,p])=>{
    const o=document.createElement("option");
    o.value=key;
    o.textContent=p.name;
    type.appendChild(o);
  });

  function render(){
    const p=problems[type.value];

    fields.innerHTML=p.fields.map(([key,label])=>`
      <div>
       <label>${label}</label>
       <input
        data-key="${key}"
        type="${key.endsWith("_list") ? "text" : "number"}"
        step="any">
      </div>
    `).join("");

    output.textContent="Enter all required givens.";
  }

  type.onchange=render;

  root.querySelector("#is-go").onclick=()=>{
    try{
      const data={};

      fields.querySelectorAll("input").forEach(input=>{
        const raw=input.value.trim();

        if(raw==="")
          throw Error("Missing: "+input.previousElementSibling.textContent);

        if(input.type==="number"){
          const n=Number(raw);
          if(!Number.isFinite(n)) throw Error("Invalid number.");
          data[input.dataset.key]=n;
        }else{
          data[input.dataset.key]=raw;
        }
      });

      output.innerHTML=steps(problems[type.value].solve(data));

    }catch(e){
      output.innerHTML=steps([
        ["INPUT CHECK",e.message]
      ]);
    }
  };

  render();
}

const P={
ohm:{
 name:"Ohm's Law — solve current",
 fields:[["V","Voltage V"],["R","Resistance Ω"]],
 solve:d=>{
  if(d.R<=0)throw Error("Resistance must be positive.");
  const I=d.V/d.R;
  return [
   ["RECOGNIZE","Voltage and resistance are known; current is unknown."],
   ["LAW","Ohm's Law connects voltage, current, and resistance."],
   ["SYMBOLIC","V = IR"],
   ["REARRANGE","I = V/R"],
   ["SUBSTITUTE",`I = ${d.V}/${d.R}`],
   ["ANSWER",`I = ${fmt(I)} A`],
   ["UNIT CHECK","V/Ω = A."],
   ["SANITY CHECK",
    `If resistance increased while voltage stayed fixed, current would decrease.`
   ]
  ];
 }
},
series:{
 name:"Series Equivalent Resistance",
 fields:[["r1","R1 Ω"],["r2","R2 Ω"],["r3","R3 Ω"]],
 solve:d=>{
  if([d.r1,d.r2,d.r3].some(x=>x<0))
   throw Error("Resistances cannot be negative.");
  const R=d.r1+d.r2+d.r3;
  return [
   ["RECOGNIZE","These resistors are in one current path."],
   ["LOGIC","Series elements carry the same current."],
   ["EQUATION","Req = R1 + R2 + R3"],
   ["SUBSTITUTE",`${d.r1} + ${d.r2} + ${d.r3}`],
   ["ANSWER",`Req = ${fmt(R)} Ω`],
   ["SANITY CHECK","Series equivalent resistance must be at least as large as the largest individual resistor."]
  ];
 }
},
parallel:{
 name:"Two Parallel Resistors",
 fields:[["r1","R1 Ω"],["r2","R2 Ω"]],
 solve:d=>{
  if(d.r1<=0||d.r2<=0)throw Error("Resistances must be positive.");
  const R=d.r1*d.r2/(d.r1+d.r2);
  return [
   ["RECOGNIZE","Both resistors share the same two nodes."],
   ["LOGIC","Parallel branches have the same voltage."],
   ["EQUATION","Req = R1R2/(R1+R2)"],
   ["SUBSTITUTE",`Req = (${d.r1})(${d.r2})/(${d.r1}+${d.r2})`],
   ["ANSWER",`Req = ${fmt(R)} Ω`],
   ["SANITY CHECK",`Req must be smaller than ${Math.min(d.r1,d.r2)} Ω. It is.`]
  ];
 }
},
divider:{
 name:"Voltage Divider",
 fields:[["Vs","Source voltage V"],["R1","Top resistor Ω"],["R2","Bottom resistor Ω"]],
 solve:d=>{
  if(d.R1<0||d.R2<=0)throw Error("Use valid positive resistance values.");
  const v=d.Vs*d.R2/(d.R1+d.R2);
  return [
   ["RECOGNIZE","Two series resistors are across the source; output is across R2."],
   ["LOGIC","Series current is I = Vs/(R1+R2), then Vout = IR2."],
   ["EQUATION","Vout = Vs·R2/(R1+R2)"],
   ["SUBSTITUTE",`${d.Vs}(${d.R2})/(${d.R1}+${d.R2})`],
   ["ANSWER",`Vout = ${fmt(v)} V`],
   ["SANITY CHECK","For positive passive resistors, Vout should lie between 0 and Vs."]
  ];
 }
},
kcl:{
 name:"KCL — Unknown Branch Current",
 fields:[["i1","Current entering node A"],["i2","Current entering node B"],["i3","Known current leaving node"]],
 solve:d=>{
  const unknown=d.i1+d.i2-d.i3;
  return [
   ["RECOGNIZE","This is a node-current problem."],
   ["LAW","KCL: charge cannot accumulate at an ideal node."],
   ["SIGN CONVENTION","Take entering currents as positive and leaving currents as negative."],
   ["EQUATION","i1 + i2 - i3 - iunknown = 0"],
   ["REARRANGE","iunknown = i1 + i2 - i3"],
   ["SUBSTITUTE",`${d.i1} + ${d.i2} - ${d.i3}`],
   ["ANSWER",`iunknown = ${fmt(unknown)} A`],
   ["INTERPRETATION",unknown<0
    ? "Negative means the real direction is opposite the assumed leaving direction."
    : "Positive means the assumed leaving direction is consistent."
   ]
  ];
 }
},
theveninload:{
 name:"Thevenin Equivalent + Load",
 fields:[["Vth","Thevenin voltage V"],["Rth","Thevenin resistance Ω"],["RL","Load resistance Ω"]],
 solve:d=>{
  if(d.Rth<0||d.RL<=0)throw Error("Use valid resistance values.");
  const I=d.Vth/(d.Rth+d.RL);
  const VL=I*d.RL;
  return [
   ["MODEL","Replace the original network by VTH in series with RTH."],
   ["LOGIC","After RL is reconnected, RTH and RL are in series."],
   ["CURRENT EQUATION","IL = VTH/(RTH + RL)"],
   ["SUBSTITUTE",`${d.Vth}/(${d.Rth}+${d.RL})`],
   ["CURRENT",`IL = ${fmt(I)} A`],
   ["LOAD VOLTAGE",`VL = IL·RL = ${fmt(VL)} V`],
   ["CHECK","VL should not exceed |VTH| in a passive series equivalent."]
  ];
 }
}
mountSolver("Circuits — Explain the electrical logic",P);

})();
