import { Component, OnInit } from "@angular/core";
import { ResultPickupFsecService } from "./result-pickup-fsec.service";
import { InputPickupService } from "../../input/input-pickup/input-pickup.service";
import { ThreeService } from "../../three/three.service";

import { ResultCombineFsecService } from "../result-combine-fsec/result-combine-fsec.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-result-pickup-fsec",
  templateUrl: "./result-pickup-fsec.component.html",
  styleUrls: [
    "../result-combine-fsec/result-combine-fsec.component.scss",
    "../../../app.component.scss",
    "../../../floater.component.scss",
  ],
})
export class ResultPickupFsecComponent implements OnInit {
  public KEYS: string[];
  public TITLES: string[];

  dataset: any[];
  page: number;
  load_name: string;
  btnCombine: string;
  tableHeight: number;
  dimension: number;
  cal: number = 0;

  circleBox = new Array();

  constructor(
    private data: ResultPickupFsecService,
    private pickup: InputPickupService,
    private three: ThreeService,
    private comb: ResultCombineFsecService,
    private helper: DataHelperModule
  ) {
    this.dataset = new Array();
    this.KEYS = this.comb.fsecKeys;
    this.TITLES = this.comb.titles;
    for (let i = 0;i<this.TITLES.length;i++) {
      this.circleBox.push(i);
    }
    this.dimension = this.helper.dimension;
  }

  ngOnInit() {
    this.loadPage(1);
    this.calPage(0);

    // コンバインデータがあればボタンを表示する
    if (this.comb.isCalculated === true) {
      this.btnCombine = "btn-change";
    } else {
      this.btnCombine = "btn-change disabled";
    }

    // テーブルの高さを計算する
    this.tableHeight = (this.dataset[0].length + 1) * 30;
  }

  //　pager.component からの通知を受け取る
  onReceiveEventFromChild(eventData: number) {
    let pageNew: number = eventData;
    this.loadPage(pageNew);
  }

  loadPage(currentPage: number) {
    if (currentPage !== this.page) {
      this.page = currentPage;
    }
    this.dataset = new Array();
    for (const key of this.KEYS) {
      const d = this.data.getPickupFsecColumns(this.page, key);
      if(d==null){
        this.dataset = new Array();
        break;
      }
      this.dataset.push(d);
    }
    this.load_name = this.pickup.getPickUpName(currentPage);

    this.three.ChangeMode("pick_fsec");
    this.three.ChangePage(currentPage);
  }

  calPage(calPage: any) {
    const carousel = document.getElementById("carousel");
    if (carousel != null) {
      carousel.classList.add("add");
    }
    const time = this.TITLES.length;
    let cal = this.cal;
    setTimeout(() => {
      this.calcal(calPage);
    }, 100);
    setTimeout(function () {
      if (carousel != null) {
        carousel.classList.remove("add");
      }
    }, 500);
  }

  calcal(calpage: any) {
    if (calpage === "-1" || calpage === "1") {
      this.cal += Number(calpage);
      if (this.cal >= this.TITLES.length) {
        this.cal = 0;
      }
      if (this.cal < 0) {
        this.cal = this.TITLES.length - 1;
      }
    } else {
      this.cal = calpage;
    }
    setTimeout(() => {
      const circle = document.getElementById(String(this.cal+20));
      if (circle !== null) {
        circle.classList.add("active");
      }
    }, 10);
  }
}
