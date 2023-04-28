import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { UserInfoService } from "./providers/user-info.service";
import { ResultDataService } from "./providers/result-data.service";
import { PrintService } from "./components/print/print.service";

import { ResultFsecService } from "./components/result/result-fsec/result-fsec.service";
import { ResultDisgService } from "./components/result/result-disg/result-disg.service";
import { ResultReacService } from "./components/result/result-reac/result-reac.service";
import { DataHelperModule } from "./providers/data-helper.module";
import { TranslateService } from "@ngx-translate/core";

import html2canvas from "html2canvas";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  btnReac!: string;
  constructor(
    private _router: Router,
    private ResultData: ResultDataService,
    public printService: PrintService,
    public helper: DataHelperModule,
    public fsec: ResultFsecService,
    public disg: ResultDisgService,
    public reac: ResultReacService,
    public print: PrintService,
    private translate: TranslateService,
  ) {
    this.translate.setDefaultLang("ja");
  }

  ngOnInit() {
    this.helper.isContentsDailogShow = false;
  }

  // 計算結果表示ボタンを無効にする
  public disableResultButton() {
    this.fsec.clear();
    this.disg.clear();
    this.reac.clear();
  }

  public dialogClose(): void {
    this.helper.isContentsDailogShow = false;

    // 印刷ウィンドウの変数をリセット
    this.resetPrintdialog();
  }

  // 印刷ウィンドウの変数をリセット
  public resetPrintdialog(): void {
    for (let i = 0; i < this.printService.printTargetValues.length; i++) {
      this.printService.printTargetValues[i].value = false;
    }

    this.printService.selectPrintCase('');
  }


  public contentsDailogShow(id): void {
    this.deactiveButtons();
    document.getElementById(id).classList.add("active");
    this.changePosition();
    this.print.mode = id;
    this.helper.isContentsDailogShow = true;
  }

  // フローティングウィンドウの位置
  public dragPosition = { x: 0, y: 0 };
  public changePosition() {
    this.dragPosition = {
      x: this.dragPosition.x,
      y: this.dragPosition.y,
    };
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

  // contents-dialogの高さをウィンドウサイズに合わせる
  setDialogHeight() {
    setTimeout(function () {
      const dialog = document.getElementById("contents-dialog-id");
      // ヘッダ領域を取得
      const header = document.getElementsByClassName("header");
      const container = document.getElementsByClassName("container");
      const headerSize =
        container[0].clientHeight + header[0].clientHeight + 50;
      dialog.style.height = window.innerHeight - headerSize + "px";
      console.log("dialog height:" + dialog.style.height);
    }, 100);
  }

  public getDialogHeight(): number {
    const dialog = document.getElementById("contents-dialog-id");
    let dialogHeight = parseFloat(dialog.style.height); // ヘッダー高さを引く
    if (isNaN(dialogHeight)) {
      dialogHeight = window.innerHeight - 300; // メニューとヘッダー高さを引く
    } else {
      dialogHeight -= 80;
    }
    return dialogHeight;
  }

  // public onPrintInvoice() {
  //   const invoiceIds = ["101", "102"];
  //   this.printService.printDocument("invoice", invoiceIds);
  // }
}

window.onload = function () {
  //HTML内に画像を表示
  html2canvas(document.getElementById("target")).then(function (canvas) {
    //imgタグのsrcの中に、html2canvasがレンダリングした画像を指定する。
    var imgData = canvas.toDataURL();
    var pic = document.getElementById("result");
    pic.setAttribute("src", "imgData");
  });
};
