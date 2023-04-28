import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { InputDataService } from "src/app/providers/input-data.service";
import { ResultDataService } from "src/app/providers/result-data.service";
import { ThreeService } from "../three/three.service";
import { PrintService } from "./print.service";
import printJS from "print-js";
import * as pako from "pako";
import { ElectronService } from "ngx-electron";
import { MaxMinService } from "../three/max-min/max-min.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";
import { TranslateService } from "@ngx-translate/core";
import packageJson from '../../../../package.json';

@Component({
  selector: "app-print",
  templateUrl: "./print.component.html",
  styleUrls: ["./print.component.scss", "../../app.component.scss"],
})
export class PrintComponent implements OnInit, OnDestroy {
  public contentEditable2;
  public combineJson: any;
  public pickupJson: any;
  public id;
  private url = "https://frameprintpdf.azurewebsites.net/api/Function1";
  public PrintScreen: string;

  constructor(
    public InputData: InputDataService,
    public printService: PrintService,
    public ResultData: ResultDataService,
    private three: ThreeService,
    private http: HttpClient,
    public max_min: MaxMinService,
    public electronService: ElectronService,
    public helper: DataHelperModule,
    private translate: TranslateService
  ) { }

  private a: boolean;
  ngOnInit() {
    this.printService.selectRadio(0);
    this.printService.flg = 0;
    this.id = document.getElementById("printButton");
    this.a = this.max_min.visible;
    this.max_min.visible = false;
    this.PrintScreen = this.translate.instant("print.PrintScreen");
  }

  ngOnDestroy(): void {
    this.max_min.visible = this.a;
  }

  public options = {
    headers: new HttpHeaders({
      "Content-Type": "application/json",
      responseType: 'text',
      Accept: "*/*",
    }),
  };

  // 経過時間計測用
  //private last_ts: number;
  //private reset_ts(): void {
  //  this.last_ts = performance.now();
  //};
  //private check_ts(): number {
  //  const tmp: number = this.last_ts;
  //  this.last_ts = performance.now();
  //  return this.last_ts- tmp;
  //};

  public onPrintPDF(): void {

    //this.reset_ts();
    //console.log("starting onPrintPDF...: 0 msec");

    // 印刷ケースをセット
    if (this.printService.printCase === 'PrintScreen') {
      // 画面印刷
      this.three.mode = 'default';
    } else if (this.printService.printCase === 'PrintDiagram') {
      // 断面力図
      this.three.mode = 'fsec';
    } else if (this.printService.printCase === 'CombPrintDiagram') {
      // Combine 断面力図
      this.three.mode = 'comb_fsec';
    } else if (this.printService.printCase === 'PickPrintDiagram') {
      // Pickup 断面力図
      this.three.mode = 'pick_fsec';
    }

    // 印刷対象を取得して、セット
    for (let i = 0; i < this.printService.printTargetValues.length; i++) {
      const isSelected = this.printService.printTargetValues[i].value;

      this.printService.customThree.threeEditable[i] = isSelected;
    }

    if (this.printService.optionList['captur'].value) {
      // 図の印刷
      if (this.helper.dimension === 2 &&
        (this.three.mode == 'fsec' ||
          this.three.mode === 'comb_fsec' ||
          this.three.mode === 'pick_fsec')) {
        console.log('図の印刷');
        //console.log('図の印刷: ' + this.check_ts() + " msec");

        // loadingの表示
        this.loadind_enable();

        // データの集計
        console.log('データを集計中...');
        //console.log('データを集計中...: ' + this.check_ts() + " msec");
        this.printService.optionList['input'].value = true;
        this.printService.optionList[this.three.mode].value = true;
        this.printService.getPrintDatas();
        console.log('データの集計完了.');
        //console.log('データの集計完了.: ' + this.check_ts() + " msec");

        // PDFサーバーに送る
        const json = {};
        for (var key of ["node", "member", "dimension", "language"]) {
          json[key] = this.printService.json[key];
        }

        // 印刷ケースを選択 ここから
        if (this.three.mode == 'fsec') {
          json["load"] = this.printService.json["load"];
          json["fsec"] = this.printService.json["fsec"];
        }
        if (this.three.mode === 'comb_fsec') {
          json["combine"] = this.printService.json["combine"];
          json["fsecCombine"] = this.printService.json["fsecCombine"];
        }
        if (this.three.mode === 'pick_fsec') {
          json["pickup"] = this.printService.json["pickup"];
          json["fsecPickup"] = this.printService.json["fsecPickup"];
        }
        // 印刷ケースの選択 ここまで

        //console.log("印刷ケースの選択 ここまで: " + this.check_ts() + " msec");

        // 印刷対象を選択 ここから
        // 断面力図の種類を指定する
        const output = [];
        if (this.printService.customThree.threeEditable[5]) {
          // z軸周りのモーメント図
          output.push("mz");
        }

        if (this.printService.customThree.threeEditable[1]) {
          // y方向のせん断力図
          output.push("fy");
        }

        if (this.printService.customThree.threeEditable[0]) {
          // 軸力図
          output.push("fx");
        }
        // 印刷対象を選択 ここまで

        //console.log("印刷対象を選択 ここまで: " + this.check_ts() + " msec");

        output.push("disg");
        json["diagramResult"] = {
          layout: this.printService.customThree.print2DThreeLayout,
          output
        }
        json["ver"] = packageJson.version;
        const base64Encoded = this.getPostJson(json);

        //console.log("base64EncodedをgetPostJsonしたところまで: " + this.check_ts() + " msec");

        this.pdfPreView(base64Encoded);

        //console.log("this.pdfPreView(base64Encoded);が終了: " + this.check_ts() + " msec");
      } else {
        // 3D図の印刷
        console.log('3D図の印刷');
        //console.log('3D図の印刷: ' + this.check_ts() + " msec");

        this.three.getCaptureImage().then((print_target) => {
          this.printService.print_target = print_target;
          //console.log('thenの中1: ' + this.check_ts() + " msec");
          this.printService.printDocument("invoice", [""]);
          //console.log('thenの中2: ' + this.check_ts() + " msec");
        });
      }
    } else {
      // 図以外の数字だけページの印刷
      const json = this.printService.json;
      if (Object.keys(json).length !== 0) {
        // loadingの表示
        this.loadind_enable();
        // PDFサーバーに送る
        this.pdfPreView(this.getPostJson(json));
      }
    }
  }

  private pdfPreView(base64Encoded: string): void {
    console.log('pdfPreView を実行中...');

    this.http
      .post(this.url, base64Encoded, this.options)
      .subscribe(
        (response) => {
          console.log('pdfPreView が完了');

          this.showPDF(response.toString());
        },
        (err) => {
          try {
            if ("error" in err) {
              if ("text" in err.error) {
                this.showPDF(err.error.text.toString());
                return;
              }
            }
          } catch (e) { }
          this.loadind_desable();
          this.helper.alert(err['message']);
        }
      );
  }

  private getPostJson(json: any): string {
    console.log('getPostJson を実行中...');

    const jsonStr = JSON.stringify(json);
    console.log(jsonStr);
    // pako を使ってgzip圧縮する
    const compressed = pako.gzip(jsonStr);
    //btoa() を使ってBase64エンコードする
    const base64Encoded = btoa(compressed);

    console.log('getPostJson が完了');

    return base64Encoded
  }

  private loadind_enable(): void {
    // loadingの表示
    document.getElementById("print-loading").style.display = "block";
    this.id.setAttribute("disabled", "true");
    this.id.style.opacity = "0.7";
  }

  // finally的な処理
  // loadingの表示終了
  private loadind_desable() {
    document.getElementById("print-loading").style.display = "none";
    const id = document.getElementById("printButton");
    this.id.removeAttribute("disabled");
    this.id.style.opacity = "";
  }

  private showPDF(base64: string) {
    this.loadind_desable();

    if (this.electronService.isElectronApp) {
      // electron の場合
      const byteCharacters = atob(base64);
      let byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      let byteArray = new Uint8Array(byteNumbers);
      let file = new Blob([byteArray], { type: 'application/pdf;base64' });
      let fileURL = URL.createObjectURL(file);
      window.open(fileURL, "_blank");

    } else {
      //Webアプリの場合
      printJS({ printable: base64, type: "pdf", base64: true });
    }

  }
}
