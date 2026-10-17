/* Small architectural portraits for the journey's floating city labels.
   CSS animates their moving parts and respects reduced-motion preferences. */
(function () {
  "use strict";

  // Each city shares one horizon. Supporting architecture sits behind the
  // moving landmark, with the river and transport in the same coordinate space.
  var skyline = {
    kolkata: '<path d="M5 120v-17h20v17M9 103v-9l6-8 6 8v9M12 94h6M32 120v-21h13v21M35 99v-8h7v8M65 120v-17h27v17M71 103v-6h15v6M100 120v-19h17v19M105 101v-8h7v8M145 120l1-36h4l1 36M144 84h9v-4h-9zM147 80v-7h3v7M5 120h151"/>',
    aberdeen: '<path class="cs-solid" d="M0 140v-27h36v27M8 113V80h10v33M7 80l6-19 6 19M24 113V96h8v17M34 140v-18h18v18M208 140v-32h33v32M214 108V87h7v21M213 87l5-15 5 15M231 108V91h7v17M230 91l5-15 5 15M242 140v-20h18v20"/><path d="M251 140V94l-14 5M251 95l9-4M256 93v13M0 140h260M4 127h28M215 121h20"/>',
    glasgow: '<path class="cs-solid" d="M0 140v-29h34v29M4 111V96h7v15M3 96l4.5-10L12 96M23 111V96h7v15M22 96l4.5-10L31 96M17 111V62h7v49M15 62l5.5-22L26 62M70 140v-26h24v26M178 140v-30h32v30M184 110V93h7v17M183 93l4.5-11L192 93M198 110V93h7v17M197 93l4.5-11L206 93M214 140v-15l8-8 8 8 8-8 8 8 8-8 6 6v17"/><path d="M0 140h260M8 120v12M17 120v12M26 120v12M185 121v11M196 121v11"/>',
    london: '<path class="cs-solid" d="m91 145 13-105 8 105M112 145V94c0-13 4-26 9-33 5 7 9 20 9 33v51M223 145v-25h33v25M228 120v-5h23v5M228 115a12 12 0 0 1 24 0M239 103V92M236 96h6M3 145v-15h21v15"/><path d="M98 145V89M116 105l10 15M126 102l-10 18M116 123l10 14M229 128v9M237 128v9M247 128v9M3 145h254"/>',
    eyLondon: '<path class="cs-solid" d="M0 132v-20h26v20M7 112V74h12v38M5 74l8-17 8 17M9 84h8M9 95h8M30 132 43 32l9 100M45 132V85M205 132V87c0-14 4-25 9-33 6 8 9 19 9 33v45M226 132v-23h32v23M230 109v-6h24v6M230 103a12 12 0 0 1 24 0M241 91V81M238 85h6"/><path d="M208 91l12 20M220 89l-12 22M230 118v8M239 118v8M250 118v8M0 132h258"/>'
  };

  function portrait(key, body) {
    return '<svg class="city-composition city-scene city-scene-' + key + '" viewBox="0 0 260 180" fill="none" aria-hidden="true">' +
      '<circle class="cs-orbit" cx="130" cy="85" r="66"/>' +
      '<path class="cs-guide" d="M130 12v8M130 151v8M56 85h8M196 85h8"/>' +
      '<g class="cs-skyline">' + skyline[key] + '</g>' + body + '</svg>';
  }

  var kolkata = portrait("kolkata",
    '<g class="cs-structure kc-bridge">' +
      '<path d="M8 110 26 78 48 59 67 80h36l19-21 22 19 18 32M8 114h154M8 110h154"/>' +
      '<path class="kc-steel" d="M26 78v32M48 59v55M67 80v30M85 80v30M103 80v30M122 59v55M144 78v32M16 96v14M37 69v41M57 69v41M113 69v41M133 69v41M153 96v14M8 110l18-32 11 32 11-51 9 51 10-30 18 30 18-30 10 30 9-51 11 51 11-32 18 32M67 80l18 30 18-30"/>' +
      '<path class="cs-solid" d="M5 114h10v9H5zM155 114h10v9h-10z"/>' +
      '<g class="kc-lights"><circle cx="26" cy="111.5" r=".9"/><circle cx="48" cy="111.5" r=".9"/><circle cx="67" cy="111.5" r=".9"/><circle cx="85" cy="111.5" r=".9"/><circle cx="103" cy="111.5" r=".9"/><circle cx="122" cy="111.5" r=".9"/><circle cx="144" cy="111.5" r=".9"/></g>' +
    '</g>' +
    '<path class="kc-bank" d="M3 125q44 8 91 2t70 5q31 5 91-1"/>' +
    '<g class="cs-structure kc-memorial">' +
      '<path class="cs-solid" d="M164 124v-19h22V99h4v-6h4c0-10 5-16 14-19 9 3 14 9 14 19h4v6h4v6h22v19z"/>' +
      '<path d="M191 93h34v6h-34zM194 93c0-8 5-13 14-19 9 6 14 11 14 19M208 77v16M199 93q0-11 9-19 9 8 9 19M208 74v-7M205 67h6M208 67v-5l-3 2m3-2 3 2"/>' +
      '<path class="cs-solid" d="M166 105v-9h10v9M165 96q0-8 6-11 6 3 6 11zM171 85v-5M240 105v-9h10v9M239 96q0-8 6-11 6 3 6 11zM245 85v-5"/>' +
      '<path d="M162 105h25M230 105h24M164 109h22M230 109h22M186 124V99h44v25M189 103h38M196 106l12-7 12 7zM195 106h26M197 107v15M203 107v15M213 107v15M219 107v15M205 122v-9a3 3 0 0 1 6 0v9M168 114h5v7h-5zM177 114h5v7h-5zM234 114h5v7h-5zM243 114h5v7h-5zM161 124h94M158 128h99"/>' +
    '</g>' +
    '<g class="cs-water"><path d="M9 133q16 3 33 1M69 134q22-4 44-1M12 141q24 4 48 1M99 142q22-3 44 0M158 141q18 4 35 1M27 148q25 3 49 0M123 150q25-3 50 0M201 143h27"/></g>' +
    '<g class="kc-ferry"><path class="kc-wake" d="M-25 7h11M-21 10h15"/>' +
      '<path class="cs-solid" d="M-16 0h33l-6 6h-20zM-10 0v-7h19v7M-12-7h24M-5-7v-4H4v4"/>' +
      '<path d="M-6-5v3M-1-5v3M4-5v3M13-2l3-3"/></g>' +
    '<path class="kc-street" d="M9 170q112-3 242 0M17 174q109-3 226 0M11 155q20-2 38-1M207 156q22 0 42 3"/>' +
    '<g class="kc-tram"><path class="cs-solid" d="M-17 152q0-3 3-3h27q4 0 4 4v11h-34z"/>' +
      '<path d="M-18 149h35M-13 153h5v6h-5zM-4 153h5v6h-5zM5 153h5v11H5zM13 153h4M-17 161H2M-13 146h24M-6 146l8-7 6 3M-2 139h7"/>' +
      '<circle class="cs-solid" cx="-10" cy="166" r="2"/><circle class="cs-solid" cx="10" cy="166" r="2"/></g>' +
    '<g class="cs-birds"><path d="M27 41q4-4 8 0 4-4 8 0M163 47q3-3 6 0 3-3 6 0"/></g>'
  );

  var aberdeen = portrait("aberdeen",
    '<g class="cs-structure">' +
      '<path class="cs-solid cs-trace" pathLength="1" d="M46 140V94h63v46M151 140V94h63v46M109 140V64h42v76M105 64h50v7h-50z"/>' +
      '<path class="cs-trace" pathLength="1" d="M111 64V47h6v17M143 64V47h6v17M110 47l4-9 4 9M142 47l4-9 4 9M117 58c-2-17 5-26 13-26 8 0 15 9 13 26M117 58c3-10 9-19 13-26 4 7 10 16 13 26M130 32v-8M126 27h8"/>' +
      '<path d="M46 94l31-16 32 16M151 94l31-16 32 16M104 140h52M42 140h176M109 114h42M109 123h42"/>' +
      '<path class="ab-windows" d="M56 107v10M70 107v10M84 107v10M98 107v10M162 107v10M176 107v10M190 107v10M204 107v10M56 127v8M70 127v8M84 127v8M98 127v8M162 127v8M176 127v8M190 127v8M204 127v8"/>' +
      '<path d="M124 140v-11a6 6 0 0 1 12 0v11M118 82v10M142 82v10"/>' +
      '<circle cx="130" cy="102" r="7"/><path d="M130 98v4l4 2"/>' +
      '<path class="cs-solid" d="M76 78V62h4v16M78 62h20v-9H78z"/>' +
      '<path class="ab-flag" d="M80 54q8-5 17 0v8q-9-5-17 0z"/>' +
    '</g>' +
    '<g class="ab-mist"><path d="M20 151q25-8 50 0t50 0t50 0t50 0M38 159q25-6 50 0t50 0t50 0"/></g>' +
    '<g class="cs-birds"><path d="M47 48q4-4 8 0 4-4 8 0M193 35q4-4 8 0 4-4 8 0"/></g>'
  );

  var glasgow = portrait("glasgow",
    '<g class="cs-structure">' +
      '<path class="cs-solid" d="M54 126V44h8v82M51 43h14v7H51zM49 126h18v6H49z"/>' +
      '<path d="m54 57 8 13-8 13 8 13-8 13M54 44l8 13M54 57h8M54 83h8M54 109h8"/>' +
      '<g class="gs-crane"><path class="cs-solid" d="m30 47 83-17 7 5-90 20z"/>' +
        '<path d="m42 45 12 4 11-9 12 5 11-9 12 5 13-10M108 38v32"/>' +
        '<g class="gs-hook"><path d="M108 70v6q0 5-4 5t-4-4"/></g></g>' +
      '<path class="cs-trace" pathLength="1" d="M23 125Q132-24 237 125M28 125Q132-12 232 125M17 125h226v5H17z"/>' +
      '<path d="M43 102v23M63 83v42M84 70v55M106 62v63M130 58v67M154 62v63M176 70v55M197 83v42M217 102v23"/>' +
      '<path class="cs-solid" d="M20 130h9v12h-9zM231 130h9v12h-9z"/>' +
      '<path class="gs-sweep" pathLength="1" d="M24 125h212"/>' +
      '<g class="gs-bus"><path class="cs-solid" d="M-15 112q0-3 3-3h24q3 0 3 3v10h-30z"/>' +
        '<path d="M-11 112h6v5h-6zM-1 112h6v5h-6zM9 112h3v10"/>' +
        '<circle cx="-9" cy="123" r="2"/><circle cx="9" cy="123" r="2"/></g>' +
    '</g>' +
    '<g class="cs-water"><path d="M15 148q18-4 36 0t36 0t36 0t36 0t36 0t36 0M27 159q18-4 36 0t36 0t36 0t36 0t36 0"/></g>'
  );

  var london = portrait("london",
    '<g class="cs-structure">' +
      '<path class="cs-solid cs-trace" pathLength="1" d="M42 145V59h30v86M39 59h36v8H39zM44 59V43h26v16M42 43l15-25 15 25M57 18v-8"/>' +
      '<path d="M48 49h18M48 55h18M46 100h22M46 108h22M49 115v20M57 115v20M65 115v20M39 145h36"/>' +
      '<circle cx="57" cy="82" r="10"/><circle cx="57" cy="82" r="1"/>' +
      '<g class="ld-clock-minute"><path d="M57 82V75"/></g><path d="m57 82 5 3"/>' +
      '<path class="cs-solid" d="M12 145v-29h30v29M75 145v-22h25v22M15 116l4-9 4 9M28 116l4-9 4 9"/>' +
      '<path d="M18 124v12M29 124v12M81 130v8M91 130v8"/>' +
      '<path d="m171 87-23 58h7l16-43 16 43h7z"/>' +
      '<g class="ld-eye"><circle class="cs-trace" pathLength="1" cx="171" cy="83" r="46"/>' +
        '<circle class="ld-inner" cx="171" cy="83" r="42"/>' +
        '<path d="M171 37v92M125 83h92M138.5 50.5l65 65M138.5 115.5l65-65M153.4 40.5l35.2 85M128.5 65.4l85 35.2M128.5 100.6l85-35.2M153.4 125.5l35.2-85"/>' +
        '<g class="ld-capsules"><ellipse cx="171" cy="37" rx="4" ry="2.5"/><ellipse cx="171" cy="129" rx="4" ry="2.5"/>' +
        '<ellipse cx="125" cy="83" rx="2.5" ry="4"/><ellipse cx="217" cy="83" rx="2.5" ry="4"/>' +
        '<circle cx="138.5" cy="50.5" r="3"/><circle cx="203.5" cy="50.5" r="3"/><circle cx="138.5" cy="115.5" r="3"/><circle cx="203.5" cy="115.5" r="3"/></g>' +
      '</g><circle cx="171" cy="83" r="3"/>' +
    '</g>' +
    '<g class="cs-water"><path d="M12 155q18-4 36 0t36 0t36 0t36 0t36 0t36 0M28 165q18-3 36 0t36 0t36 0t36 0t36 0"/></g>'
  );

  function towerBridgeSvg() {
    return '<svg class="city-composition city-scene city-scene-london tower-bridge" viewBox="0 0 260 180" fill="none" aria-hidden="true">' +
      '<circle class="tb-orbit" cx="130" cy="87" r="67"/>' +
      '<path class="tb-guide" d="M130 13v9M130 152v9M56 87h9M195 87h9"/>' +
      '<g class="cs-skyline">' + skyline.eyLondon + '</g>' +
      '<g class="tb-structure">' +
      '<path class="tb-cable" pathLength="1" d="M12 123Q48 114 76 61M184 61Q212 114 248 123"/>' +
      '<path class="tb-cable" pathLength="1" d="M12 128Q49 121 76 70M184 70Q211 121 248 128"/>' +
      '<path class="tb-hangers" d="M27 120v10M40 115v15M53 104v26M65 85v45M195 85v45M207 104v26M220 115v15M233 120v10"/>' +
      '<path class="tb-walkway" pathLength="1" d="M86 68h88v9H86zM86 72.5h88M94 68v9M108 68v9M122 68v9M138 68v9M152 68v9M166 68v9"/>' +
      '<g class="tb-tower tb-tower-left">' +
      '<path d="M66 133V58h24v75M63 58h30v7H63zM64 133h28v7H64z"/>' +
      '<path d="M65 58V44h7v14M84 58V44h7v14M64 44l4.5-12L73 44M83 44l4.5-12L92 44"/>' +
      '<path d="M73 58V46l5-9 5 9v12M74 46h8M70 32v-6M87 32v-6"/>' +
      '<path class="tb-windows" d="M72 78v9M84 78v9M72 94v9M84 94v9M74 133v-16a4 4 0 0 1 8 0v16"/>' +
      '</g><g class="tb-tower tb-tower-right">' +
      '<path d="M170 133V58h24v75M167 58h30v7h-30zM168 133h28v7h-28z"/>' +
      '<path d="M169 58V44h7v14M188 58V44h7v14M168 44l4.5-12L177 44M187 44l4.5-12L196 44"/>' +
      '<path d="M177 58V46l5-9 5 9v12M178 46h8M174 32v-6M191 32v-6"/>' +
      '<path class="tb-windows" d="M176 78v9M188 78v9M176 94v9M188 94v9M178 133v-16a4 4 0 0 1 8 0v16"/>' +
      '</g><path class="tb-approach" d="M8 130h58M194 130h58M8 134h58M194 134h58"/>' +
      '<g class="tb-bascule tb-bascule-left"><path d="M90 130h40v4H90zM94 130v-4M102 130v-4M110 130v-4M118 130v-4M126 130v-4M90 126h40"/></g>' +
      '<g class="tb-bascule tb-bascule-right"><path d="M130 130h40v4h-40zM134 130v-4M142 130v-4M150 130v-4M158 130v-4M166 130v-4M130 126h40"/></g>' +
      '</g><g class="tb-river"><path d="M10 146q20-5 40 0t40 0t40 0t40 0t40 0t40 0M22 156q20-5 40 0t40 0t40 0t40 0t40 0M45 166q20-4 40 0t40 0t40 0t40 0"/></g>' +
      '<g class="tb-boat"><path d="M-10 0h20l-4 5H-6zM-5 0v-5H4v5M-1-5v-5"/></g>' +
      '</svg>';
  }


  window.JourneyCityScenes = { kolkata: kolkata, aberdeen: aberdeen, glasgow: glasgow, london: london, "ey-london": towerBridgeSvg() };
})();
