import { Component, OnInit } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { AppComponent } from "../../app.component";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { PrintService } from "../print/print.service";

import { LoginDialogComponent } from "../login-dialog/login-dialog.component";
import { WaitDialogComponent } from "../wait-dialog/wait-dialog.component";

import * as FileSaver from "file-saver";

import { InputDataService } from "../../providers/input-data.service";
import { ResultDataService } from "../../providers/result-data.service";
import { ThreeService } from "../three/three.service";

import * as pako from "pako";

import { DataHelperModule } from "src/app/providers/data-helper.module";
import { SceneService } from "../three/scene.service";
import { AngularFireAuth } from "@angular/fire/auth";
import { UserInfoService } from "src/app/providers/user-info.service";
import { environment } from "src/environments/environment";
import { PrintCustomFsecService } from "../print/custom/print-custom-fsec/print-custom-fsec.service";
import { LanguagesService } from "src/app/providers/languages.service";
import { ElectronService } from 'ngx-electron';
import { TranslateService } from "@ngx-translate/core";
import packageJson from '../../../../package.json';

@Component({
  selector: "app-menu",
  templateUrl: "./menu.component.html",
  styleUrls: ["./menu.component.scss", "../../app.component.scss"],
})
export class MenuComponent implements OnInit {
  loginUserName: string;
  public fileName: string;
  public version: string;

  constructor(
    private modalService: NgbModal,
    private app: AppComponent,
    private scene: SceneService,
    private helper: DataHelperModule,
    private InputData: InputDataService,
    public ResultData: ResultDataService,
    private PrintData: PrintService,
    private CustomFsecData: PrintCustomFsecService,
    private http: HttpClient,
    private three: ThreeService,
    public printService: PrintService,
    public auth: AngularFireAuth,
    public user: UserInfoService,
    public language: LanguagesService,
    public electronService: ElectronService,
    private translate: TranslateService
  ) {
    this.fileName = "";
    this.three.fileName = "";
    this.version = packageJson.version;
  }

  ngOnInit() {
    this.fileName = "";
    this.three.fileName = "";
    this.helper.isContentsDailogShow = false;
    this.setDimension(2);
  }

  // 新規作成
  renew(): void {
    this.app.dialogClose(); // 現在表示中の画面を閉じる
    this.InputData.clear();
    this.ResultData.clear();
    this.PrintData.clear();
    this.CustomFsecData.clear();
    this.three.ClearData();
    this.fileName = "";
    this.three.fileName = "";
    this.three.mode = "";
  }

  // Electron でファイルを開く
  open_electron(){

    const response = this.electronService.ipcRenderer.sendSync('open');

    if(response.status!==true){
      this.helper.alert('ファイルを開くことに失敗しました, status:'+ response.status);
      return;
    }
    this.app.dialogClose(); // 現在表示中の画面を閉じる
    this.InputData.clear();
    this.ResultData.clear();
    this.PrintData.clear();
    this.CustomFsecData.clear();
    this.three.ClearData();
    // this.countArea.clear();
    const modalRef = this.modalService.open(WaitDialogComponent);

    this.fileName = response.path;
    this.three.fileName = response.path;

    this.app.dialogClose(); // 現在表示中の画面を閉じる
    this.ResultData.clear(); // 解析結果を削除
    const old = this.helper.dimension;
    const jsonData: {} = JSON.parse(response.text);
    let resultData: {} = null;
    if ("result" in jsonData) {
      resultData = jsonData["result"];
      delete jsonData["result"];
    }
    this.InputData.loadInputData(jsonData); // データを読み込む
    if (resultData !== null) {
      this.ResultData.loadResultData(resultData); // 解析結果を読み込む
      this.ResultData.isCalculated = true;
    } else {
      this.ResultData.isCalculated = false;
    }
    if (old !== this.helper.dimension) {
      this.setDimension(this.helper.dimension);
    }
    this.three.fileload();
    modalRef.close();

  }

  // ファイルを開く
  open(evt) {
    this.app.dialogClose(); // 現在表示中の画面を閉じる
    this.InputData.clear();
    this.ResultData.clear();
    this.PrintData.clear();
    this.CustomFsecData.clear();
    this.three.ClearData();
    // this.countArea.clear();
    const modalRef = this.modalService.open(WaitDialogComponent);

    const file = evt.target.files[0];
    this.fileName = file.name;
    this.three.fileName = file.name;
    evt.target.value = "";
    this.fileToText(file)
      .then((text) => {
        this.app.dialogClose(); // 現在表示中の画面を閉じる
        this.ResultData.clear(); // 解析結果を削除
        const old = this.helper.dimension;
        const jsonData: {} = JSON.parse(text);
        let resultData: {} = null;
        if ("result" in jsonData) {
          resultData = jsonData["result"];
          delete jsonData["result"];
        }
        this.InputData.loadInputData(jsonData); // データを読み込む
        if (resultData !== null) {
          this.ResultData.loadResultData(resultData); // 解析結果を読み込む
          this.ResultData.isCalculated = true;
        } else {
          this.ResultData.isCalculated = false;
        }
        if (old !== this.helper.dimension) {
          this.setDimension(this.helper.dimension);
        }
        this.three.fileload();
        modalRef.close();
      })
      .catch((err) => {
        this.helper.alert(err);
        modalRef.close();
      });
  }

  // 上書き保存
  // 上書き保存のメニューが表示されるのは electron のときだけ
  public overWrite(): void {
    if (this.fileName === ""){
      this.save();
      return;
    }
    const inputJson: string = JSON.stringify(this.InputData.getInputJson());
    this.fileName = this.electronService.ipcRenderer.sendSync('overWrite', this.fileName, inputJson);
  }

  private fileToText(file): any {
    const reader = new FileReader();
    reader.readAsText(file);
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject(reader.error);
      };
    });
  }

  // ファイルを保存
  save(): void {
    const inputJson: string = JSON.stringify(this.InputData.getInputJson());
    if (this.fileName.length === 0) {
      this.fileName = "frameWebForJS.json";
      this.three.fileName = "frameWebForJS.json";
    }
    if (this.helper.getExt(this.fileName) !== "json") {
      this.fileName += ".json";
    }
    // 保存する
    if(this.electronService.isElectronApp) {
      this.fileName = this.electronService.ipcRenderer.sendSync('saveFile', this.fileName, inputJson, "json");
    } else {
      const blob = new window.Blob([inputJson], { type: "text/plain" });
      FileSaver.saveAs(blob, this.fileName);
    }
  }

  // 計算
  public calcrate(): void {
    const modalRef = this.modalService.open(WaitDialogComponent);

    this.auth.currentUser.then((user) => {
      if (user === null) {
        modalRef.close();
        this.helper.alert(this.translate.instant("menu.P_login"));
        return;
      }

      const jsonData: {} = this.InputData.getInputJson(0);

      if ("error" in jsonData) {
        this.helper.alert(jsonData["error"]);
        modalRef.close(); // モーダルダイアログを消す
        return;
      }

      if (!window.confirm(this.translate.instant("menu.calc_start"))) {
        modalRef.close(); // モーダルダイアログを消す
        return;
      }

      jsonData["uid"] = user.uid;
      jsonData["production"] = environment.production;

      this.ResultData.clear(); // 解析結果情報をクリア

      this.post_compress(jsonData, modalRef);
    });
  }

  private post_compress(jsonData: {}, modalRef: NgbModalRef) {
    const url = environment.calcURL; // 'https://asia-northeast1-the-structural-engine.cloudfunctions.net/frameWeb-2';

    // json string にする
    const json = JSON.stringify(jsonData, null, 0);
    console.log(json);
    // pako を使ってgzip圧縮する
    const compressed = pako.gzip(json);
    //btoa() を使ってBase64エンコードする
    const base64Encoded = btoa(compressed);

    this.http
      .post(url, base64Encoded, {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
          "Content-Encoding": "gzip,base64",
        }),
        responseType: "text",
      })
      .subscribe(
        (response) => {
          // 通信成功時の処理（成功コールバック）
          console.log(this.translate.instant("menu.success"));
          try {
            if (response.includes("error") || response.includes("exceeded")) {
              throw response;
            }
            // Decode base64 (convert ascii to binary)
            const strData = atob(response);
            // Convert binary string to character-number array
            const charData = strData.split("").map(function (x) {
              return x.charCodeAt(0);
            });
            // Turn number array into byte-array
            const binData = new Uint8Array(charData);
            // Pako magic
            const json = pako.ungzip(binData, { to: "string" });

            const jsonData = JSON.parse(json);
            // サーバーのレスポンスを集計する
            console.log(jsonData);
            if ("error" in jsonData) {
              throw jsonData.error;
            }

            // ポイントの処理
            const _jsonData = {};
            for (const key of Object.keys(jsonData)) {
              if ((typeof jsonData[key]).toLowerCase() === "number") {
                this.user[key] = jsonData[key];
              } else {
                _jsonData[key] = jsonData[key];
              }
            }

            this.InputData.getResult(jsonData);

            // 解析結果を集計する
            this.ResultData.loadResultData(_jsonData);
            this.ResultData.isCalculated = true;
          } catch (e) {
            this.helper.alert(e);
          } finally {
            modalRef.close(); // モーダルダイアログを消す
            this.helper.alert(
              this.user.deduct_points 
              + this.translate.instant("menu.deduct_points") 
              + this.user.new_points 
              + this.translate.instant("menu.new_points")
            );
          }
        },
        (error) => {
          let messege: string = "通信 " + error.statusText;
          if ("_body" in error) {
            messege += "\n" + error._body;
          }
          this.helper.alert(messege);
          console.error(error);
          modalRef.close();
        }
      );
  }

  // ピックアップファイル出力
  public pickup(): void {
    let pickupJson: string;
    let ext: string;
    if (this.helper.dimension === 2) {
      pickupJson = this.ResultData.GetPicUpText2D();
      ext = "pik";
    } else {
      pickupJson = this.ResultData.GetPicUpText();
      ext = "csv";
    }
    const blob = new window.Blob([pickupJson], { type: "text/plain" });
    let filename: string = "frameWebForJS" + ext;
    if (this.fileName.length > 0) {
      filename = this.fileName.split(".").slice(0, -1).join(".");
    }
    // 保存する
    if(this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.sendSync('saveFile', filename, pickupJson, ext);
    } else {
      filename += '.';
      filename += ext;
      FileSaver.saveAs(blob, filename);
    }
  }

  // ログイン関係
  logIn(): void {
    this.app.dialogClose(); // 現在表示中の画面を閉じる
    this.modalService.open(LoginDialogComponent).result.then((result) => {});
  }

  logOut(): void {
    this.auth.signOut();
  }

  //　印刷フロート画面用
  public dialogClose(): void {
    this.helper.isContentsDailogShow = false;
  }

  public contentsDailogShow(id): void {
    this.deactiveButtons();
    document.getElementById(id).classList.add("active");
    if (id === 13) {
      this.printService.clear();
      this.CustomFsecData.clear();
    }
    this.helper.isContentsDailogShow = true;
  }

  // アクティブになっているボタンを全て非アクティブにする
  deactiveButtons() {
    for (let i = 0; i <= 13; i++) {
      const data = document.getElementById(i + "");
      if (data != null) {
        if (data.classList.contains("active")) {
          data.classList.remove("active");
        }
      }
    }
  }

  public setDimension(dim: number = null) {
    if (dim === null) {
      if (this.helper.dimension === 2) {
        this.helper.dimension = 3;
      } else {
        this.helper.dimension = 2;
      }
    } else {
      this.helper.dimension = dim;
      const g23D: any = document.getElementById("toggle--switch");
      g23D.checked = this.helper.dimension === 3;
    }
    this.app.dialogClose(); // 現在表示中の画面を閉じる
    this.scene.changeGui(this.helper.dimension);
  }

  // テスト ---------------------------------------------
  private saveResult(text: string): void {
    const blob = new window.Blob([text], { type: "text/plain" });
    FileSaver.saveAs(blob, "frameWebResult.json");
  }

  //解析結果ファイルを開く
  resultopen(evt) {
    const modalRef = this.modalService.open(WaitDialogComponent);

    const file = evt.target.files[0];
    this.fileName = file.name;
    this.three.fileName = file.name;
    evt.target.value = "";

    this.fileToText(file)
      .then((text) => {
        this.app.dialogClose(); // 現在表示中の画面を閉じる
        this.ResultData.clear();
        const jsonData = JSON.parse(text);

        this.ResultData.loadResultData(jsonData);
        modalRef.close();
      })
      .catch((err) => {
        this.helper.alert(err);
        modalRef.close();
      });
  }

  public goToLink() {
    window.open(
      "https://liberating-rodent-f3f.notion.site/4e2148bfe8704aa6b6dbc619d539c8c3?v=76a73b4693404e64a56ab8f8ff538e4d",
      "_blank"
    );
  }
}
