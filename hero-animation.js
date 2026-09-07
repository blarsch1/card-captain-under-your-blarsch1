// Card Captain hero transformation — decorative only, no league data touched.
(function(){
  function mount(){
    const hero=document.querySelector('.hero.comic-card');
    if(!hero||hero.querySelector('.captain-transform'))return;
    const art=document.createElement('div');
    art.className='captain-transform';
    art.setAttribute('aria-hidden','true');
    art.innerHTML=`
      <div class="power-ring ring-one"></div>
      <div class="power-ring ring-two"></div>
      <div class="spark spark-a">✦</div><div class="spark spark-b">✦</div><div class="spark spark-c">✦</div>
      <svg class="captain-svg" viewBox="0 0 420 360" role="presentation">
        <defs>
          <filter id="pinkGlow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="goldGlow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <linearGradient id="superSuit" x1="0" x2="1"><stop offset="0" stop-color="#111a38"/><stop offset=".55" stop-color="#35205a"/><stop offset="1" stop-color="#0b1024"/></linearGradient>
        </defs>

        <g class="normal-player">
          <ellipse cx="205" cy="330" rx="82" ry="10" fill="#000" opacity=".42"/>
          <path d="M171 129 Q205 104 240 129 L253 211 Q245 244 207 251 Q169 244 159 211Z" fill="#f3f1df" stroke="#0a0b16" stroke-width="7"/>
          <path d="M178 133 L151 148 126 212 148 221 176 174" fill="#f3f1df" stroke="#0a0b16" stroke-width="7"/>
          <path d="M237 137 L266 153 291 205 268 216 240 176" fill="#f3f1df" stroke="#0a0b16" stroke-width="7"/>
          <circle cx="207" cy="96" r="35" fill="#202943" stroke="#080910" stroke-width="7"/>
          <path d="M175 95 Q207 72 240 95 L238 109 178 109Z" fill="#293454"/>
          <rect x="177" y="104" width="59" height="9" rx="4" fill="#0b0d19"/>
          <text x="207" y="193" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="54" fill="#19213b" stroke="#ff3cac" stroke-width="2">12</text>
          <path d="M177 244 L164 319 190 326 208 260" fill="#e7e8e8" stroke="#090a13" stroke-width="7"/>
          <path d="M233 245 L247 319 222 327 204 260" fill="#e7e8e8" stroke="#090a13" stroke-width="7"/>
          <ellipse cx="139" cy="218" rx="23" ry="15" transform="rotate(-28 139 218)" fill="#8d4a22" stroke="#180c08" stroke-width="5"/>
          <path d="M132 205 L147 230" stroke="#f5e2bd" stroke-width="3"/>
          <g class="plain-card" transform="translate(276 146) rotate(9)"><rect x="0" y="0" width="44" height="62" rx="4" fill="#f8f0cf" stroke="#ffc928" stroke-width="4"/><rect x="7" y="7" width="30" height="37" fill="#131a34"/><circle cx="22" cy="18" r="7" fill="#6de7ff"/><path d="M12 41 Q22 27 32 41" fill="#ff3cac"/><rect x="9" y="50" width="26" height="4" fill="#171823"/></g>
        </g>

        <g class="transform-burst" filter="url(#goldGlow)">
          <path d="M210 38 225 97 258 53 254 116 309 80 278 134 343 125 286 160 348 190 282 188 319 244 265 207 267 273 231 218 207 284 199 220 153 265 174 207 111 232 150 186 84 174 149 158 103 115 166 137 149 72 190 116Z" fill="#ffcf31" opacity=".85"/>
          <path d="M212 67 221 121 252 89 244 137 289 119 258 154 306 164 261 177 290 214 248 193 245 239 221 199 204 243 196 201 162 230 174 190 134 203 165 177 124 159 168 154 145 121 185 136 178 97 201 126Z" fill="#ff3cac" opacity=".92"/>
          <circle cx="211" cy="167" r="50" fill="#fff8dc" opacity=".82"/>
          <text x="212" y="180" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="42" fill="#0b0d19">POWER!</text>
        </g>

        <g class="super-player" filter="url(#pinkGlow)">
          <ellipse cx="224" cy="331" rx="101" ry="11" fill="#000" opacity=".48"/>
          <path d="M139 135 Q214 93 290 137 L310 223 Q279 264 219 267 Q157 262 126 221Z" fill="url(#superSuit)" stroke="#ffcf31" stroke-width="8"/>
          <path d="M147 142 105 164 75 226 101 239 151 190" fill="#1a2244" stroke="#ff3cac" stroke-width="8"/>
          <path d="M284 143 329 160 358 215 331 230 281 187" fill="#1a2244" stroke="#ff3cac" stroke-width="8"/>
          <circle cx="216" cy="92" r="42" fill="#151d3a" stroke="#ffcf31" stroke-width="8"/>
          <path d="M177 91 Q216 62 256 91 L254 110 179 110Z" fill="#202b55"/>
          <rect x="181" y="101" width="72" height="12" rx="5" fill="#080910"/>
          <path class="eye-glow" d="M194 103 h16 M225 103 h16" stroke="#ff3cac" stroke-width="6" stroke-linecap="round"/>
          <path d="M193 51 202 34 213 47 225 27 238 48 249 35 254 55Z" fill="#ffcf31" stroke="#ff3cac" stroke-width="4"/>
          <path d="M155 146 Q109 104 78 109 Q113 148 104 194 Q127 171 155 167Z" fill="#ff3cac" opacity=".86" stroke="#ffcf31" stroke-width="5"/>
          <text x="219" y="210" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="72" fill="#ffcf31" stroke="#ff3cac" stroke-width="3">12</text>
          <path d="M172 260 L151 328 185 335 219 275" fill="#141d3c" stroke="#ffcf31" stroke-width="8"/>
          <path d="M257 259 L282 326 248 337 215 276" fill="#141d3c" stroke="#ffcf31" stroke-width="8"/>
          <ellipse cx="91" cy="236" rx="28" ry="18" transform="rotate(-28 91 236)" fill="#9a5225" stroke="#ffcf31" stroke-width="5"/>
          <path d="M82 221 L100 249" stroke="#f5e2bd" stroke-width="4"/>
          <g class="power-card" transform="translate(333 126) rotate(8)"><rect x="0" y="0" width="52" height="72" rx="5" fill="#fff3bd" stroke="#ff3cac" stroke-width="5"/><rect x="7" y="7" width="38" height="43" fill="#121a38"/><circle cx="26" cy="19" r="8" fill="#ffcf31"/><path d="M13 47 Q26 27 39 47" fill="#ff3cac"/><text x="26" y="64" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="10" fill="#0b0d19">CAPTAIN</text></g>
          <path class="bolt bolt1" d="M68 121 112 131 92 151 133 160 90 205" fill="none" stroke="#ffcf31" stroke-width="8"/>
          <path class="bolt bolt2" d="M319 73 295 118 330 116 303 164 352 151" fill="none" stroke="#6de7ff" stroke-width="8"/>
        </g>
      </svg>
      <div class="transform-caption"><span class="caption-normal">PLAYER</span><span class="caption-power">CAPTAIN</span></div>`;
    hero.appendChild(art);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
