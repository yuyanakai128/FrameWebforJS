import { Component, OnInit } from "@angular/core";
import { ResultDisgService } from "./result-disg.service";
import { InputLoadService } from "../../input/input-load/input-load.service";
import { ThreeService } from "../../three/three.service";

import { ResultCombineDisgService } from "../result-combine-disg/result-combine-disg.service";
import { ResultPickupDisgService } from "../result-pickup-disg/result-pickup-disg.service";

import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-result-disg",
  templateUrl: "./result-disg.component.html",
  styleUrls: [
    "./result-disg.component.scss",
    "../../../app.component.scss",
    "../../../floater.component.scss",
  ],
})
export class ResultDisgComponent implements OnInit {
  public KEYS: string[];
  public TITLES: string[];
  dataset: any[];
  page: number;
  load_name: string;
  btnCombine: string;
  btnPickup: string;
  dimension: number;

  LL_flg: boolean[];
  LL_page: boolean;
  cal: number = 0;

  circleBox = new Array();

  constructor(
    private data: ResultDisgService,
    private load: InputLoadService,
    private three: ThreeService,
    private comb: ResultCombineDisgService,
    private pic: ResultPickupDisgService,
    private helper: DataHelperModule
  ) {
    this.dataset = new Array();
    this.dimension = this.helper.dimension;
    this.KEYS = this.comb.disgKeys;
    this.TITLES = this.comb.titles;
    for (let i = 0; i < this.TITLES.length; i++) {
      this.circleBox.push(i);
    }
  }

  ngOnInit() {
    this.loadPage(1);
    setTimeout(() => {
      const circle = document.getElementById(String(this.cal + 20));
      if (circle !== null) {
        circle.classList.add("active");
      }
    }, 10);

    this.LL_flg = this.data.LL_flg;

    // コンバインデータがあればボタンを表示する
    if (this.comb.isCalculated === true) {
      this.btnCombine = "btn-change";
    } else {
      this.btnCombine = "btn-change disabled";
    }
    // ピックアップデータがあればボタンを表示する
    if (this.pic.isCalculated === true) {
      this.btnPickup = "btn-change";
    } else {
      this.btnPickup = "btn-change disabled";
    }
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

    this.load_name = this.load.getLoadName(currentPage);

    if(this.page <= this.data.LL_flg.length){
      this.LL_page =this.data.LL_flg[this.page - 1];
    } else {
      this.LL_page = false;
    }

    if(this.LL_page===true){
      this.dataset = new Array();
      for (const key of this.KEYS) {
        this.dataset.push(this.data.getDisgColumns(this.page, key));
      }
    } else{
      this.dataset = this.data.getDisgColumns(this.page);
    }

    this.three.ChangeMode("disg");
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
      const circle = document.getElementById(String(this.cal + 20));
      if (circle !== null) {
        circle.classList.add("active");
      }
    }, 10);
  }
}
