var $rd = { };
$rd.wpr = "";
$rd.trns = { };
$rd.esc = { };
$rd.pdl = { };
$rd.lok = { };
$rd.dAjr = { };
$rd.tSnl = { };
$rd.stng = { };
$rd.ngn = { };
$rd.ltg = { };
$rd.hvac = { };
$rd.tmp = { };
$rd.crz = { };
$rd.spd = { };
$rd.TPMS = { };
$rd.vin;
$rd.up = { };
$rd.d = { };

$vinParse = [];

$rtnTimerArray = new Object();

exports.addMessage = function($ch,$dt) {
  var $startT = Date.now();
  switch ($ch) {
    case "002":
      // steering angle
      $rd.stng.pcnt = dataDecode3($dt,"sig",0,16,"b",0,0.000205,0,-1);
      $rd.stng.whl = Math.round($rd.stng.percent*485);
      $rd.stng.tir = Math.round($rd.stng.percent * (180 * 2.7) / 14.4);
      break;
    case "0D1":
      $rd.pdl.brkPrs = dataDecode3($dt,"d",16,8,"b",0,1.20481927711,0,0);
      $rd.spd.mph = dataDecode3($dt,"d",16,16,"l",0,0.0349521,0,0);
      break;
    case "0D3":
      $escRaw = dataDecode3($dt,"b");
      $rd.esc.FullAct = $escRaw.substr(31,1);
      $rd.esc.VDCAct = $escRaw.substr(4,1);
      $rd.esc.ESCAct = $escRaw.substr(25,1);
      $rd.esc.TCSOff = $escRaw.substr(12,1);
      $rd.esc.isBrk = $escRaw.substr(18,1);
      break;
    case "0D4":
      $rd.spd.wssFL = dataDecode3($dt,"d",0,16,"l",0,0.0349521,0,-1);
      $rd.spd.wssFR = dataDecode3($dt,"d",16,16,"l",0,0.0349521,0,-1);
      $rd.spd.wssRL = dataDecode3($dt,"d",32,16,"l",0,0.0349521,0,-1);
      $rd.spd.wssRR = dataDecode3($dt,"d",48,16,"l",0,0.0349521,0,-1);
      $rd.spd.wssAvg = ($rd.spd.wssFL + $rd.spd.wssFR + $rd.spd.wssRL + $rd.spd.wssRR)/4;
      $rd.TPMS.FL = Math.round($rd.spd.wssAvg*100 - $rd.spd.wssFL*100);
      $rd.TPMS.FR = Math.round($rd.spd.wssAvg*100 - $rd.spd.wssFR*100);
      $rd.TPMS.RL = Math.round($rd.spd.wssAvg*100 - $rd.spd.wssRL*100);
      $rd.TPMS.RR = Math.round($rd.spd.wssAvg*100 - $rd.spd.wssRR*100);
      break;
    case "140":
      $rd.ngn.RPM = dataDecode3($dt,"d",35,13,"l");
      $rd.ngn.tbody = dataDecode3($dt, "d", 48, 8, "b", 0, 0.392157, 0, 0);
      $rd.ngn.isOffAccl = dataDecode3($dt, "b", 25, 1); // (Is clutch pressed)
      $rd.pdl.accel = dataDecode3($dt, "d", 0, 8, "b", 0, 0.392157, 0, 0);
      break;
    case "141":
      $gData = dataDecode3($dt, "d", 53, 3);
      if($rd.trns.isReverse === "1"){
        $rd.trns.gear = "R";
      }else if($gData === 7){
        $rd.trns.gear = "N";
      }else if ($rd.ngn.isoffAccelerator !== "1" && $gData > 0) {
        $rd.trns.gear = $gData;
      }
      $rd.d.rev1 = dataDecode3($dt,"d",51,13,"l"); //byte 0/1(5bits) LE
      $rd.d.rev2 = dataDecode3($dt,"d",36,12,"l"); //byte 2/3(last 4bit) LE
      $dt = dataDecode3($dt,"b");
      //$rd.pdl.isoffAccelerator = $dt.substr(40,1);
      $rd.d.D141_5 = $dt.substr(59,1);
      $rd.d.D141_6 = $dt.substr(60,1);

      break;
    case "144":
      $rd.d.D144rev4 = dataDecode3($dt,"d",16,8); // throttle based?
      $dt = dataDecode3($dt,"b");
      $rd.d.D144_2 = $dt.substr(5,1);  //button?
      $rd.d.D144_3 = $dt.substr(6,1);  //button?
      $rd.d.D144_4 = $dt.substr(49,1); //button?
      //$rd.d.D144_5 = $dt.substr(52,1); //brake pedal light
      //$rd.crz.active = $dt.substr(55,1); //cruise enabled

      $rd.crz.btnUp = $dt.substr(3,1);
      $rd.crz.btnDn = $dt.substr(4,1);
      $rd.crz.btnCncl = $dt.substr(2,1);
      break;
    case "152":
      $hl = dataDecode3($dt,"b");
      $rd.ltg.DRL = $hl.substr(61,1);
      $rd.ltg.HL = $hl.substr(60,1);
      $rd.ltg.HB = $hl.substr(59,1);
      $rd.ltg.BRK = $hl.substr(51,1);
      $rd.pdl.PBRK = $hl.substr(52,1);
      $rd.wpr = $hl.substr(57,1);
      $rd.d.D152_1 = $hl.substr(53,1); //lighting? washer spray?
      break;
    case "154":
      $dt = dataDecode3($dt,"b");
      //$rd.esc.isBraking = $dt.substr(61,1)
      $rd.trns.isRvse = $dt.substr(62,1);
      break;
    case "280":
      $rd.d.D280_1 = dataDecode3($dt,"b",20,1);
      break;
    case "281":
      //HVAC System
      $hvr = dataDecode3($dt,"b",0,40);
      $hvacSystm = $hvr.substr(0,22); //on/off
      $hvacFan = $hvr.substr(0,3); //001-111 1-7levels
      $hvacMode = $hvr.substr(3,3);
      $hvacRecirc = $hvr.substr(8,2); // 10 Outside, 01 Recirc
      $hvacRDefst = $hvr.substr(10,1);
      $hvacACCmp = $hvr.substr(11,1);
      $hvacAuto = $hvr.substr(12,2); // 00 None, 01 Auto, 10 Full Auto
      $hvacTmp = $hvr.substr(16,6); //000000 LO, 000101 61, 100001 89, 101100 MAX (Above b33 is MAX, below b5 is LOW)

      if ($hvacSystm === "0000000000000000111111") {
        $rd.hvac.system = "off";
      }else{ // HVAC IS ON
        $rd.hvac.system = "on";
        $rd.hvac.fanLevel = binToDec($hvacFan);
        switch($hvacMode){
          case "001":
          $rd.hvac.mode = "face";
          break;
          case "010":
          $rd.hvac.mode = "faceFeet";
          break;
          case "011":
          $rd.hvac.mode = "feet";
          break;
          case "100":
          $rd.hvac.mode = "feetWindshield";
          break;
          case "101":
          $rd.hvac.mode = "windshield";
          break;
        }
        $hvacTmp = binToDec($hvacTmp);
        if ($hvacTmp > 33) {
          $rd.hvac.tmp = "HI";
        }else if($hvacTmp < 5){
          $rd.hvac.tmp = "LO";
        }else{
          $rd.hvac.tmp = $hvacTmp+56;
        }
        switch($hvacRecirc){
          case "00":
          $rd.hvac.rcrc = "null";
          break;
          case "01":
          $rd.hvac.rcrc = "recirc";
          break;
          case "10":
          $rd.hvac.rcrc = "fresh";
          break;
        }
        $rd.hvac.rrDfst = $hvacRDefst;
        $rd.hvac.AC = $hvacACCmp;
        switch($hvacAuto){
          case "00":
          $rd.hvac.auto = "noAuto";
          break;
          case "01":
          $rd.hvac.auto = "auto";
          break;
          case "10":
          $rd.hvac.auto = "fullAuto";
          break;
        }
      }
      $rd.hvac.dispAct = $hvr.substr(38,1); // IF CONTROLS WERE MODIFIED LAST 2 SECONDS
      break;
    case "282":
      $rd.d.TempFuel0 = dataDecode3($dt,"d",0,8); // temp, or fuel? // FIX THIS
      $rd.d.tempAmbient = dataDecode3($dt,"d",24,8); // temp, or fuel?
      $rd.d.tempInlet = dataDecode3($dt,"d",32,8); // temp, or fuel?

      $dt = dataDecode3($dt,"b");
      $rd.d.driverSeatUnbukl = $dt.substr(47,1);
      $rd.tSnl.Left = $dt.substr(43,1);
      $rd.tSnl.Right = $dt.substr(42,1);
      break;
    case "360":
      $rd.tmp.oil = dataDecode3($dt, "d", 16, 8, "b", -40, 1.8, 32, 0);
      $rd.tmp.clnt = dataDecode3($dt, "d", 24, 8, "b", -40, 1.8, 32, 0);
      $rd.ngn.boost = dataDecode3($dt, "d", 32, 8, "b", 0, 0.28571428571, -14, 1);
      $rd.crz.active = dataDecode3($dt,"b",43,1);
      $rd.d.FuelConsIns = dataDecode3($dt,"d",48,16,"l");
      $dt = dataDecode3($dt,"b");
      //$rd.crz.active = $dt.substr(43,1); //Cruise On
      $rd.d.D360_3 = $dt.substr(50,1);
      //$rd.d.D360_4 = $dt.substr(51,1); //AC comp relay
      $rd.d.D360_5 = $dt.substr(54,1);
      break;
    case "361":
      $rd.d.D361_1 = dataDecode3($dt,"b",4,4);
      break;
    case "362":
      break;
    case "370":
      $rd.stng.ttlTq = dataDecode3($dt,"d",52,12,"l");
      $rd.stng.angTq = dataDecode3($dt,"sig",32,8,"b");
      break;
    case "371":
      break;
    case "374":
      $dt = dataDecode3($dt,"b"); //ID374:32:1 is a false ID
      //Fog Lights
      $rd.ltg.fog = $dt.substr(9,1);
      break;
    case "375":
      $dt = dataDecode3($dt,"b");
      //Instrument cluster bright on/off
      $rd.ltg.insClstrFullBright = $dt.substr(24,1); // Buggy - Signal is very hard to catch properly
      //Remote lock/unlock actions
      $rd.lok.Lock = $dt.substr(25,1);
      $rd.lok.UnlockDriver = $dt.substr(26,1);
      $rd.lok.UnlockAll = $dt.substr(27,1);
      $rd.lok.BCMAwake = $dt.substr(29,1);
      //Door Ajar
      $rd.dAjr.TR = $dt.substr(10,1);
      $rd.dAjr.DF = $dt.substr(15,1);
      $rd.dAjr.PF = $dt.substr(14,1);
      $rd.dAjr.PR = $dt.substr(13,1);
      $rd.dAjr.DR = $dt.substr(12,1);
      break;
    case "376":
      $rd.ltg.dimPos = dataDecode3($dt,"d",0,8,"b",0,1,0,0); //an analog pot with indents
      switch($rd.ltg.dimPos){ // these values might not work for every car
          case 0:
          $rd.ltg.dim = "0";
          break;
          case 33:
          $rd.ltg.dim = "1";
          break;
          case 82:
          $rd.ltg.dim = "2";
          break;
          case 125:
          $rd.ltg.dim = "3";
          break;
          case 173:
          $rd.ltg.dim = "4";
          break;
          case 250:
          $rd.ltg.dim = "5";
          break;
        }
      break;
    case "3D1":
      $rd.d.fuelCons = dataDecode3($dt,"d",51,13,"l");
      break;
    case "660":
      $rd.up.sec = dataDecode3($dt,"d",48,16,"b",0,1,0,0)/10;
      hours = Math.floor($rd.upSeconds / 3600);
      $rd.up.sec %= 3600;
      minutes = Math.floor($rd.upSeconds / 60);
      $rd.up.disp = hours+"h "+minutes+"'";
      break;
    case "6D1":
      $rd.d.TripOdo = dataDecode3($dt,"d",52,12,"l",0,1,0,0);
      $rd.d.TripOdoFix = $rd.d.TripOdo*0.09047;
      $rd.d.D6D1_2 = dataDecode3($dt,"d",8,8,"b",0,1,0,0); // troubleshoot this
      break;
    case "6FC":
      $byte = dataDecode3($dt,"d",40,8,"b",0,1,0,0);
      $letter = dataDecode3($dt,"d",48,8,"b",0,1,0,0);
      $vinParse[$byte] = String.fromCharCode($letter);
      if ($vinParse.join("").length === 17) {
        $rd.vin = $vinParse.join("");
      }else{
        $rd.vin = "LOADING VIN "+$vinParse.join("").length+"/17";
      }
      break;
  }
  $rtnTime = Date.now()-$startT; // get worst time for debugging
  if ($rtnTimerArray[$ch] < $rtnTime || typeof $rtnTimerArray[$ch] == "undefined") {
    $rtnTimerArray[$ch] = $rtnTime;
  }
  return $rd;
}


// convert and scale function
function dataDecode3($hD, $outTyp = "d", $ofsB = 0, $lenB = $hD.length * 4, $end = "b", $bias = 0, $sca = 1, $pbias = 0, $prec = -1) {
  if ($end == "l") {
    $hD = $hD.replace(/^(.(..)*)$/, "0$1").match(/../g).reverse().join("");
  }
  
  $hD = hexToBin($hD).substr($ofsB, $lenB);
  switch ($outTyp) {
    case "sig":
      $int = binToDec($hD);
      $sigMax = binToDec($hD.replace(/(.)/g,"1"))+1;// store  max
      if ($int >= 0.5*$sigMax) {$int = Math.abs($int - $sigMax+1);}else{$int = -$int;}
      $hD = ($int + $bias) * $sca + $pbias;
      if ($prec !== -1) {
        $hD = Math.round($hD * Math.pow(10, $prec || 0)) / Math.pow(10, $prec || 0);
      }
      return $hD;
      break;
    case "b":
      return $hD;
      break;
    case "h":
      return binToHex($hD);
      break;
    case "d":
      $hD = (binToDec($hD) + $bias) * $sca + $pbias;
      if ($prec !== -1) {
        $hD = Math.round($hD * Math.pow(10, $prec || 0)) / Math.pow(10, $prec || 0);
      }
      return $hD;
      break;
    case "hd":
      return binToHex($hD).replace(/(.{2})/g,"$1 ");
      break;
    case "bd":
      return $hD.replace(/(.{8})/g,"$1 ");
      break;
    }
}
//Log scale big first
function logBig(position,min,max) {
  var minv = Math.log(min);
  var maxv = Math.log(max);
  // calculate adjustment factor
  var scale = (maxv-minv) / (max-min);
  $out = (Math.log(position)-minv) / scale + min;
  if ($out == "-Infinity") {
    return 0;
  }else{
    return $out;
  }
  
}
//Log scale small first
function logSmall(position,min,max) {
  var minv = Math.log(min);
  var maxv = Math.log(max);
  // calculate adjustment factor
  var scale = (maxv-minv) / (max-min);
  $out = Math.exp(minv + scale*(position-min));
  if ($out == "-Infinity") {
    return 0;
  }else{
    return $out;
  }
}
function add(x, y, base) {
  var z = [];
  var n = Math.max(x.length, y.length);
  var carry = 0;
  var i = 0;
  while (i < n || carry) {
    var xi = i < x.length ? x[i] : 0;
    var yi = i < y.length ? y[i] : 0;
    var zi = carry + xi + yi;
    z.push(zi % base);
    carry = Math.floor(zi / base);
    i++;
  }
  return z;
}
function multiplyByNumber(num, x, base) {
  if (num < 0) return null;
  if (num == 0) return [];

  var result = [];
  var power = x;
  while (true) {
    if (num & 1) {
      result = add(result, power, base);
    }
    num = num >> 1;
    if (num === 0) break;
    power = add(power, power, base);
  }
  return result;
}
function parseToDigitsArray(str, base) {
  var digits = str.split('');
  var ary = [];
  for (var i = digits.length - 1; i >= 0; i--) {
    var n = parseInt(digits[i], base);
    if (isNaN(n)) return null;
    ary.push(n);
  }
  return ary;
}
function convertBase(str, fromBase, toBase) {
  var digits = parseToDigitsArray(str, fromBase);
  if (digits === null) return null;
  var outArray = [];
  var power = [1];
  for (var i = 0; i < digits.length; i++) {
    // invariant: at this point, fromBase^i = power
    if (digits[i]) {
      outArray = add(outArray, multiplyByNumber(digits[i], power, toBase), toBase);
    }
    power = multiplyByNumber(fromBase, power, toBase);
  }
  var out = '';
  for (var i = outArray.length - 1; i >= 0; i--) {
    out += outArray[i].toString(toBase);
  }
  if(!out && toBase=="10"){out = "0";} // make 0x00 return non null value
  return out;
}
function decToHex(decStr) {
  var hex = convertBase(decStr, 10, 16);
  return hex ? '0x' + hex : null;
}
function decToBin(decStr) {
  decStr = String(decStr);
  console.log(decStr);
  return convertBase(decStr, 10, 2).padStart(decStr.length*8, '0');
}
function hexToDec(hexStr) {
  hexStr = String(hexStr);
  hexStr = hexStr.toLowerCase();
  return parseInt(convertBase(hexStr, 16, 10));
}
function hexToBin(hexStr) {
  hexStr = String(hexStr);
  if (hexStr.substring(0, 2) === '0x') hexStr = hexStr.substring(2);
    hexStr = hexStr.toLowerCase();
  return convertBase(hexStr, 16, 2).padStart(hexStr.length*4, '0');
}
function binToHex(binStr) {
  return convertBase(binStr, 2, 16).padStart(binStr.length/4, '0').toUpperCase();
}
function binToDec(binStr) {
  return parseInt(convertBase(binStr, 2, 10));
}