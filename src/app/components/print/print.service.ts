import { Directionality } from "@angular/cdk/bidi";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { DataHelperModule } from "src/app/providers/data-helper.module";
import { InputDataService } from "src/app/providers/input-data.service";
import { LanguagesService } from "src/app/providers/languages.service";
import { ResultDataService } from "src/app/providers/result-data.service";
import { PrintCustomDisgService } from "./custom/print-custom-disg/print-custom-disg.service";
import { PrintCustomFsecService } from "./custom/print-custom-fsec/print-custom-fsec.service";
import { PrintCustomReacService } from "./custom/print-custom-reac/print-custom-reac.service";
import { PrintCustomThreeService } from "./custom/print-custom-three/print-custom-three.service";

@Injectable({
  providedIn: "root",
})
export class PrintService {
  public isPrinting = false;
  public optionList: {};
  public mode: number;
  public selectedIndex: string;

  public inputJson: any;
  public combineJson: any;
  public defineJson: any;
  public pickupJson: any;

  public flg: number = -1;

  public print_target: any; // Three.js 印刷 の図のデータ
  public printOption = [];
  public printRadio: any;
  public json = {};
  private priCount: number = 0;
  public pageCount: number = 0;
  public pageOver: boolean = false; // printPossibleを超えるようなページ数の場合にtrue
  private printPossible: number = 1000; // ページ数の閾値
  public pageDisplay: boolean = true; //　概算ページ数の表示
  public pageError: boolean = false; // 対象データの存在

  // 印刷ケースのラジオボタン値
  public printCase: string;

  // 印刷対象のチェックボックス値
  public printTargetValues = [
    { value: false }, // 軸方向力
    { value: false }, // y軸方向のせん断力
    { value: false }, // z軸方向のせん断力
    { value: false }, // ねじりモーメント
    { value: false }, // y軸回りのモーメント
    { value: false }, // z軸回りのモーメント
  ];

  constructor(
    private router: Router,
    public InputData: InputDataService,
    private ResultData: ResultDataService,
    private customFsec: PrintCustomFsecService,
    private customReac: PrintCustomReacService,
    private customDisg: PrintCustomDisgService,
    public customThree: PrintCustomThreeService,
    private helper: DataHelperModule,
    private language: LanguagesService
  ) {
    this.clear();
    this.printOption = new Array();
  }

  public fescIndex = [
    "axialForce",
    "shearForceY",
    "shearForceZ",
    "torsionalMoment",
    "momentY",
    "momentZ",
  ];

  public fescIndexJa = [
    "軸方向力",
    "y軸方向のせん断力",
    "z軸方向のせん断力",
    "ねじりモーメント",
    "y軸方向のモーメント",
    "z軸方向のモーメント",
  ];

  public clear() {
    this.optionList = {
      input: { id: 0, value: false, name: "入力データ" },
      disg: { id: 1, value: false, name: "変位量" },
      comb_disg: { id: 2, value: false, name: "COMBINE 変位量" },
      pick_disg: { id: 3, value: false, name: "PICKUP 変位量" },
      reac: { id: 4, value: false, name: "反力" },
      comb_reac: { id: 5, value: false, name: "COMBINE 反力" },
      pick_reak: { id: 6, value: false, name: "PICKUP 反力" },
      fsec: { id: 7, value: false, name: "断面力" },
      comb_fsec: { id: 8, value: false, name: "COMBINE 断面力" },
      pick_fsec: { id: 9, value: false, name: "PICKUP 断面力" },
      captur: { id: 10, value: false, name: "画面印刷" }
    };
  }

  public setprintDocument() {
    // 入力データを取得する
    this.inputJson = this.InputData.getInputJson(1);
    this.combineJson = this.ResultData.getCombineJson();
    this.defineJson = this.ResultData.getDefineJson();
    this.pickupJson = this.ResultData.getPickUpJson();
  }

  public printDocument(documentName: string, documentData: string[]) {
    this.isPrinting = true;
    this.router.navigate([
      "/",
      {
        outlets: {
          print: ["print", documentName, documentData.join()],
        },
      },
    ]);
  }

  public onDataReady() {
    setTimeout(() => {
      window.print();
      this.isPrinting = false;
      this.router.navigate([{ outlets: { print: null } }]);
    });
  }

  public select() {
    let n = 0;
    this.printOption = new Array();
    this.flg = -1;
    setTimeout(() => {
      for (const key of Object.keys(this.optionList)) {
        if (this.optionList[key].value === true) {
          if (key == 'fsec' || key === 'comb_fsec' || key === 'pick_fsec' || key === 'captur') {
            this.printOption[n] = this.optionList[key];
            n += 1;
          }
        }
      }

      this.printOption = this.printOption.filter(
        (element, index, self) =>
          self.findIndex((e) => e.id === element.id) === index
      );

      if (this.printOption.length > 0 && "id" in this.printOption[0]) {
        this.flg = Number(this.printOption[0].id);
        this.selectedIndex = String(this.flg);
      }
    }, 50);
  }

  // 印刷データ
  // ラジオボタン選択時に発動．一旦すべてfalseにしてから，trueにする．
  public selectRadio(id: number) {
    this.printOption = new Array();
    for (const key of Object.keys(this.optionList)) {
      this.optionList[key].value = false;
      if (this.optionList[key].id == id) {
        this.optionList[key].value = true;
        this.flg = id;
        this.selectedIndex = this.optionList[key].id;
      }
    }

    this.priCount = 0;

    this.newPrintJson();
  }

  // 印刷ケース
  // ラジオボタン選択時に発動
  public selectPrintCase(printCase: string) {
    this.printCase = printCase;
  }

  // ページ予想枚数を計算する
  public newPrintJson() {
    setTimeout(() => {
      // pricount:行数をためる
      this.priCount = 0;
      // 画面の印刷であれば行数のカウント
      if (!(this.optionList['captur'].value === true)) {
        this.getPrintDatas(); // サーバーに送るデータをつくる
      } else {
        this.pageError = false; // 画像印刷はエラー対象にしない
      }
      // 50刻みで概算ページ数を計算する
      // 69：1ページ当たりの入る行数
      this.pageCount = Math.ceil((Math.ceil(this.priCount / 69) * 2) / 50) * 50;
      // 概算ページ数が1000ページ(this.printPossible)を超えると，印刷不可
      this.pageOver = this.pageCount > this.printPossible ? true : false;

      // 概算ページ数が50いかない場合と，入力データ，画像データの時には，概算ページ数を非表示にする．
      if (!(this.optionList['input'].value == true
        || this.optionList['captur'].value == true)) {
        if (this.pageCount > 50) {
          this.pageDisplay = true;
        } else {
          this.pageDisplay = false;
        }
      }

      // 印刷するボタンのactive/非active化
      const id = document.getElementById("printButton");
      if (this.pageOver || this.pageError) {
        id.setAttribute("disabled", "true");
        id.style.opacity = "0.7";
      } else {
        id.removeAttribute("disabled");
        id.style.opacity = "";
      }
    }, 100);
  }

  public getPrintDatas() {
    // データを取得，サーバーに送る用のデータをつくる．
    // データを作りながら，行数をカウントする．

    this.json = {}; // サーバーに送るデータ

    if (this.optionList['input'].value &&
      Object.keys(this.InputData.getInputJson(1)).length !== 0) {
      this.json = this.InputData.getInputJson(1);
    }

    if (this.ResultData.isCalculated == true) {

      // 変位量
      if (this.optionList['disg'].value &&
        Object.keys(this.ResultData.disg.disg).length !== 0) {
        this.json["disg"] = this.dataChoice(this.ResultData.disg.disg);
        this.json["disgName"] = this.getNames(this.json["disg"]);
      }

      // COMBINE 変位量
      if (this.optionList['comb_disg'].value &&
        Object.keys(this.ResultData.combdisg.disgCombine).length !== 0) {
        this.json["disgCombine"] = this.dataChoice(
          this.ResultData.combdisg.disgCombine
        );
        this.json["disgCombineName"] = this.getNames(
          this.json["disgCombine"],
          "Combine"
        );
      }

      // PICKUP 変位量
      if (this.optionList['pick_disg'].value &&
        Object.keys(this.ResultData.pickdisg.disgPickup).length !== 0) {
        this.json["disgPickup"] = this.dataChoice(
          this.ResultData.pickdisg.disgPickup
        );
        this.json["disgPickupName"] = this.getNames(
          this.json["disgPickup"],
          "Pickup"
        );
      }

      // 断面力
      if (this.optionList['fsec'].value &&
        Object.keys(this.ResultData.fsec.fsec).length !== 0) {
        this.json["fsec"] = this.dataChoiceFsec(this.ResultData.fsec.fsec);
        this.json["fsecName"] = this.getNames(this.json["fsec"]);
      }

      // COMBINE 断面力
      if (this.optionList['comb_fsec'].value &&
        Object.keys(this.ResultData.combfsec.fsecCombine).length !== 0) {
        this.json["fsecCombine"] = this.dataChoiceFsec(
          this.ResultData.combfsec.fsecCombine
        );
        this.json["fsecCombineName"] = this.getNames(
          this.json["fsecCombine"],
          "Combine"
        );
      }

      // PICKUP 断面力
      if (this.optionList['pick_fsec'].value &&
        Object.keys(this.ResultData.pickfsec.fsecPickup).length !== 0) {
        this.json["fsecPickup"] = this.dataChoiceFsec(
          this.ResultData.pickfsec.fsecPickup
        );
        this.json["fsecPickupName"] = this.getNames(
          this.json["fsecPickup"],
          "Pickup"
        );
      }

      // 反力
      if (this.optionList['reac'].value &&
        Object.keys(this.ResultData.reac.reac).length !== 0) {
        this.json["reac"] = this.dataChoice(this.ResultData.reac.reac);
        this.json["reacName"] = this.getNames(this.json["reac"]);
      }

      // COMBINE 断面力
      if (this.optionList['comb_reac'].value &&
        Object.keys(this.ResultData.combreac.reacCombine).length !== 0) {
        this.json["reacCombine"] = this.dataChoice(
          this.ResultData.combreac.reacCombine
        );
        this.json["reacCombineName"] = this.getNames(
          this.json["reacCombine"],
          "Combine"
        );
      }

      // PICKUP 断面力
      if (this.optionList['pick_reak'].value &&
        Object.keys(this.ResultData.pickreac.reacPickup).length !== 0) {
        this.json["reacPickup"] = this.dataChoice(
          this.ResultData.pickreac.reacPickup
        );
        this.json["reacPickupName"] = this.getNames(
          this.json["reacPickup"],
          "Pickup"
        );
      }
    }
    if (Object.keys(this.json).length === 0) {
      this.pageError = true;
      return;
    }
    this.pageError = false;

    this.json["dimension"] = this.helper.dimension;
    this.json["language"] = this.language.browserLang;

    return;// this.json;
  }

  private getNames(json, target = "") {
    const keys: string[] = Object.keys(json);
    this.getNamesAll(target); // combine,pickup時,combineとpickuoデータを取得する
    var name = new Array();
    for (const index of keys) {
      let loadName = "";
      switch (target) {
        // combine名称を取得する
        case "Combine":
          if (index in this.combineJson) {
            if ("name" in this.combineJson[index]) {
              loadName = this.combineJson[index].name;
            }
          }
          break;
        // pickup名称を取得する
        case "Pickup":
          if (index in this.pickupJson) {
            if ("name" in this.pickupJson[index]) {
              loadName = this.pickupJson[index].name;
            }
          }
          break;
        // 基本荷重名称を取得する
        default:
          let l: any = this.InputData.load.getLoadNameJson(null, index);
          if (index in l) {
            loadName = l[index].name;
          }
          break;
      }
      var tmp = new Array();
      tmp.push("Case." + index, loadName);
      name.push(tmp);
    }
    return name;
  }

  private getNamesAll(target) {
    switch (target) {
      case "Combine":
        this.combineJson = this.InputData.combine.getCombineJson();
        break;
      case "Pickup":
        this.pickupJson = this.InputData.pickup.getPickUpJson();
        break;
    }
  }

  // 断面力用
  private dataChoiceFsec(json) {
    //　部材番号指定の一覧データ
    const choiceMember = this.customFsec.dataset;
    //　軸方向指定データ
    const axis = this.customFsec.fsecEditable;
    let split = {};
    this.priCount += 2;
    //case毎
    for (const type of Object.keys(json)) {
      let kk = 0;
      let body1 = new Array();
      let body2 = {};
      let basic: boolean = true;
      this.priCount += 2;

      // let i = 0;

      const body3 = json[type];
      const keys = Object.keys(body3);
      const key0 = keys[0];
      const int0 = Number(key0);

      // 各データor軸方向別データ
      for (const list of keys) {
        const body4 = body3[list];

        // 各データか軸方向別データかどうかの分岐
        // key：
        // 各データ＝"1",軸方向別データ:"dx_max" 数値に変えられるかどうか
        if (isFinite(int0)) {
          // 部材番号が空の場合は部材番号が前のものと同じ
          const item = body4;
          kk = item.m === "" ? kk : Number(item.m) - 1;
          // 指定の部材番号データのみ
          if ('check' in choiceMember[kk]) {
            if (choiceMember[kk].check === false) {
              continue;
            }
          }
          body1.push(item);
          this.priCount += 1;

        } else {
          let axisArr = new Array();
          basic = false;
          if (axis[list] === true) {
            this.priCount += 2;

            for (const ax of Object.keys(body4)) {
              const item = body4[ax];
              // 部材番号が空の場合は部材番号が前のものと同じ
              kk = item.m === "" ? kk : Number(item.m) - 1;
              // 指定の部材番号データのみ
              if ('check' in choiceMember[kk]) {
                if (choiceMember[kk].check === false) {
                  continue;
                }
              }
              axisArr.push(item);
              this.priCount += 1;
            }
            body2[list] = axisArr;
          }
          // i++;
        }
      }
      split[type] = basic ? body1 : body2;
    }
    return split;
  }

  // 反力，変位用
  private dataChoice(json) {
    let split = {}; // まとめのデータ
    this.priCount += 2;

    //case毎
    for (const type of Object.keys(json)) {
      let basic: boolean = true;

      let body1 = new Array(); // 軸指定がないとき
      let body2 = {}; //LL,combine,pickup
      // let i = 0;
      this.priCount += 2;

      const body3 = json[type];
      const keys = Object.keys(body3);
      const key0 = keys[0];
      const int0 = Number(key0);

      for (const list of keys) {
        const body4 = body3[list];

        if (isFinite(int0)) {
          body1.push(body4);
          this.priCount += 1;

        } else {
          let axisArr = {};
          basic = false;

          // LL,combine,Pickup用，反力か変位かをデータ形式から判断する
          // dx_maxがある時：変位量データ
          const axis = (key0 === "dx_max")
            ? this.customDisg.disgEditable
            : this.customReac.reacEditable;

          // 軸方向にチェックがついていた時
          if (axis[list] === true) {
            this.priCount += 2;

            for (const ax of Object.keys(body4)) {
              const item = body4[ax];
              axisArr[ax] = item;
              this.priCount += 1;
            }
            body2[list] = axisArr;
          }
          // i++;
        }
      }
      split[type] = basic ? body1 : body2;
    }
    return split;
  }
}
