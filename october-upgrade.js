(() => {
"use strict";

const style = document.createElement("style");
style.textContent = `
.course-upgrade{
  max-width:1120px;margin:24px auto;padding:0 18px 50px;
  color:#fff9e9;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif
}
.course-upgrade .upgrade-card{
  background:#29203b;border:1px solid #604e75;border-radius:20px;
  padding:22px;margin:14px 0;box-shadow:0 14px 35px #0b081755
}
.course-upgrade .upgrade-grid{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px
}
.course-upgrade h2,.course-upgrade h3{margin-top:0}
.course-upgrade input,.course-upgrade select{
  width:100%;padding:11px;margin:5px 0 12px;border-radius:9px;
  border:1px solid #75618a;background:#1c1830;color:white;font:inherit
}
.course-upgrade button{
  border:0;border-radius:10px;padding:11px 14px;background:#ffcf57;
  color:#251a2c;font-weight:850;cursor:pointer
}
.course-upgrade .formula{
  padding:10px 12px;background:#1c1830;border-radius:10px;margin:8px 0;
  line-height:1.5
}
.course-upgrade .answerbox{
  background:#1c1830;border-left:4px solid #70e2d1;
  padding:14px;border-radius:8px;white-space:pre-wrap
}
.course-upgrade .muted2{color:#c7b8d7}
`;
document.head.appendChild(style);

const root = document.createElement("section");
root.className = "course-upgrade";

root.innerHTML = `
<div class="upgrade-card">
  <p style="color:#70e2d1;font-weight:900;letter-spacing:.1em">EET 2000 COURSE UPGRADE</p>
  <h2>⚡ Circuits Circus Study Lab</h2>
  <p class="muted2">
    Keep the original Thevenin game above. Use this section when you need to
    slow down, identify the circuit type, choose a formula, and solve it.
  </p>
</div>

<div class="upgrade-grid">
  <div class="upgrade-card">
    <h3>🧠 What do I use?</h3>
    <select id="cc-topic">
      <option value="ohm">Ohm's Law</option>
      <option value="series">Series resistors</option>
      <option value="parallel">Parallel resistors</option>
      <option value="divider">Voltage divider</option>
      <option value="power">Power</option>
      <option value="kcl">KCL</option>
      <option value="kvl">KVL</option>
      <option value="thevenin">Thevenin</option>
      <option value="norton">Norton</option>
    </select>
    <div id="cc-topic-help" class="answerbox"></div>
  </div>

  <div class="upgrade-card">
    <h3>🧮 Quick Solver</h3>

    <label>Solver type</label>
    <select id="cc-solver-type">
      <option value="ohm">Ohm's Law: V, I, R</option>
      <option value="series">Series equivalent resistance</option>
      <option value="parallel2">Two resistors in parallel</option>
      <option value="divider">Voltage divider</option>
      <option value="load">Thevenin load current</option>
    </select>

    <div id="cc-fields"></div>

    <button id="cc-solve">Solve step by step</button>
    <div id="cc-result" class="answerbox" style="margin-top:14px">
      Choose a solver and enter the givens.
    </div>
  </div>
</div>

<div class="upgrade-card">
  <h3>📝 Formula Sheet</h3>
  <div class="upgrade-grid">
    <div>
      <div class="formula"><b>Ohm:</b> V = IR</div>
      <div class="formula"><b>Power:</b> P = VI = I²R = V²/R</div>
      <div class="formula"><b>Series:</b> Req = R1 + R2 + ...</div>
      <div class="formula"><b>Parallel:</b> 1/Req = 1/R1 + 1/R2 + ...</div>
    </div>
    <div>
      <div class="formula"><b>Voltage divider:</b> Vout = Vs · R2/(R1+R2)</div>
      <div class="formula"><b>KCL:</b> ΣI entering = ΣI leaving</div>
      <div class="formula"><b>KVL:</b> ΣV around a closed loop = 0</div>
      <div class="formula"><b>Thevenin load:</b> IL = VTH/(RTH+RL)</div>
      <div class="formula"><b>Norton:</b> IN = VTH/RTH and RN = RTH</div>
    </div>
  </div>
</div>
`;

document.body.appendChild(root);

const help = {
  ohm: `OHM'S LAW

Ask which two quantities you know.

V = I R
I = V / R
R = V / I

Unit check:
V / Ω = A
V / kΩ = mA`,
  series: `SERIES

Same current through every series element.

Req = R1 + R2 + ...

Voltage drops add to the source voltage.`,
  parallel: `PARALLEL

Same voltage across every parallel branch.

1/Req = 1/R1 + 1/R2 + ...

For exactly two:
Req = R1R2/(R1+R2)`,
  divider: `VOLTAGE DIVIDER

For R1 on top and R2 to ground:

Vout = Vs × R2/(R1 + R2)

Only use the simple divider when the output is not significantly loaded.`,
  power: `POWER

P = VI
P = I²R
P = V²/R

Pick the version that uses the quantities you already know.`,
  kcl: `KCL — NODE RULE

Charge does not pile up at a node.

ΣI entering = ΣI leaving

Choose current directions first.
A negative solved current means the real direction is opposite.`,
  kvl: `KVL — LOOP RULE

ΣV = 0 around any closed loop.

Pick a loop direction.
Track voltage rises and drops consistently.`,
  thevenin: `THEVENIN

1. Remove the load.
2. Find open-circuit voltage → VTH.
3. Turn off independent sources.
   Voltage source → SHORT.
   Current source → OPEN.
4. Find resistance seen from the terminals → RTH.
5. Reconnect RL.
6. IL = VTH/(RTH + RL).`,
  norton: `NORTON

IN = short-circuit current at the output.
RN = resistance seen from the output.

For linear resistive circuits:
RN = RTH
IN = VTH/RTH`
};

const topic = document.getElementById("cc-topic");
const topicHelp = document.getElementById("cc-topic-help");

function showHelp(){
  topicHelp.textContent = help[topic.value];
}
topic.addEventListener("change", showHelp);
showHelp();

const solverType = document.getElementById("cc-solver-type");
const fields = document.getElementById("cc-fields");
const result = document.getElementById("cc-result");

const configs = {
  ohm: [
    ["v","Voltage V (leave blank if unknown)"],
    ["i","Current I in A (leave blank if unknown)"],
    ["r","Resistance R in Ω (leave blank if unknown)"]
  ],
  series: [
    ["r1","R1 in Ω"],
    ["r2","R2 in Ω"],
    ["r3","R3 in Ω (optional)"]
  ],
  parallel2: [
    ["r1","R1 in Ω"],
    ["r2","R2 in Ω"]
  ],
  divider: [
    ["vs","Source voltage Vs"],
    ["r1","Top resistor R1"],
    ["r2","Bottom resistor R2"]
  ],
  load: [
    ["vth","VTH in V"],
    ["rth","RTH"],
    ["rl","RL"]
  ]
};

function renderFields(){
  fields.innerHTML = configs[solverType.value].map(([id,label]) => `
    <label>${label}</label>
    <input id="cc-${id}" type="number" step="any">
  `).join("");
  result.textContent = "Enter the givens, then solve.";
}
solverType.addEventListener("change",renderFields);
renderFields();

function n(id){
  const el=document.getElementById("cc-"+id);
  if(!el || el.value.trim()==="") return null;
  const value=Number(el.value);
  return Number.isFinite(value) ? value : null;
}

document.getElementById("cc-solve").addEventListener("click",()=>{
  try{
    const type=solverType.value;
    let out="";

    if(type==="ohm"){
      const v=n("v"), i=n("i"), r=n("r");
      const count=[v,i,r].filter(x=>x!==null).length;
      if(count!==2) throw Error("Enter exactly TWO of V, I, and R.");

      if(v===null){
        out=`GIVEN: I = ${i} A, R = ${r} Ω\nFORMULA: V = IR\nSUBSTITUTE: V = ${i} × ${r}\nANSWER: V = ${(i*r).toFixed(4)} V`;
      }else if(i===null){
        if(r===0) throw Error("Resistance cannot be zero for this calculation.");
        out=`GIVEN: V = ${v} V, R = ${r} Ω\nFORMULA: I = V/R\nSUBSTITUTE: I = ${v}/${r}\nANSWER: I = ${(v/r).toFixed(6)} A`;
      }else{
        if(i===0) throw Error("Current cannot be zero when solving R = V/I.");
        out=`GIVEN: V = ${v} V, I = ${i} A\nFORMULA: R = V/I\nSUBSTITUTE: R = ${v}/${i}\nANSWER: R = ${(v/i).toFixed(4)} Ω`;
      }
    }

    if(type==="series"){
      const vals=[n("r1"),n("r2"),n("r3")].filter(x=>x!==null);
      if(vals.length<2) throw Error("Enter at least R1 and R2.");
      const req=vals.reduce((a,b)=>a+b,0);
      out=`TYPE: SERIES\nRULE: same current\nFORMULA: Req = R1 + R2 + ...\nSUBSTITUTE: ${vals.join(" + ")}\nANSWER: Req = ${req.toFixed(4)} Ω`;
    }

    if(type==="parallel2"){
      const r1=n("r1"), r2=n("r2");
      if(r1===null||r2===null||r1<=0||r2<=0) throw Error("Enter positive R1 and R2.");
      const req=r1*r2/(r1+r2);
      out=`TYPE: PARALLEL\nRULE: same voltage\nFORMULA: Req = R1R2/(R1+R2)\nSUBSTITUTE: (${r1}×${r2})/(${r1}+${r2})\nANSWER: Req = ${req.toFixed(4)} Ω`;
    }

    if(type==="divider"){
      const vs=n("vs"),r1=n("r1"),r2=n("r2");
      if([vs,r1,r2].some(x=>x===null)) throw Error("Enter Vs, R1, and R2.");
      if(r1+r2===0) throw Error("R1 + R2 cannot be zero.");
      const vo=vs*r2/(r1+r2);
      out=`TYPE: VOLTAGE DIVIDER\nFORMULA: Vout = Vs·R2/(R1+R2)\nSUBSTITUTE: ${vs}×${r2}/(${r1}+${r2})\nANSWER: Vout = ${vo.toFixed(4)} V`;
    }

    if(type==="load"){
      const vth=n("vth"),rth=n("rth"),rl=n("rl");
      if([vth,rth,rl].some(x=>x===null)) throw Error("Enter VTH, RTH, and RL.");
      if(rth+rl===0) throw Error("RTH + RL cannot be zero.");
      const il=vth/(rth+rl);
      out=`THEVENIN LOAD\nFORMULA: IL = VTH/(RTH + RL)\nSUBSTITUTE: ${vth}/(${rth}+${rl})\nANSWER: IL = ${il.toFixed(6)} in units consistent with your resistance units.`;
    }

    result.textContent=out;
  }catch(err){
    result.textContent="CHECK INPUTS: "+err.message;
  }
});

})();
