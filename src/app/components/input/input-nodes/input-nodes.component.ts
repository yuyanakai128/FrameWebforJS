import { Component, OnInit, ViewChild } from "@angular/core";
import { InputNodesService } from "./input-nodes.service";
import { DataHelperModule } from "../../../providers/data-helper.module";

import { ThreeService } from "../../three/three.service";
import { SheetComponent } from '../sheet/sheet.component';
import pq from "pqgrid";
import { AppComponent } from "src/app/app.component";

@Component({
  selector: "app-input-nodes",
  templateUrl: "./input-nodes.component.html",
  styleUrls: ["./input-nodes.component.scss", "../../../app.component.scss"],
})
export class InputNodesComponent implements OnInit {

  @ViewChild('grid') grid: SheetComponent;

  private dataset = [];
  private columnKeys = ["X", "Y", "Z"];
  private columnHeaders3D =[
    { title: this.columnKeys[0], dataType: "float",  format: "#.000", dataIndx: "x",  sortable: false, width: 90 },
    { title: this.columnKeys[1], dataType: "float",  format: "#.000", dataIndx: "y",  sortable: false, width: 90 },
    { title: this.columnKeys[2], dataType: "float",  format: "#.000", dataIndx: "z",  sortable: false, width: 90 },
  ];
  private columnHeaders2D =[
    { title: this.columnKeys[0], dataType: "float",  format: "#.000", dataIndx: "x",  sortable: false, width: 90 },
    { title: this.columnKeys[1], dataType: "float",  format: "#.000", dataIndx: "y",  sortable: false, width: 90 },
  ];

  private ROWS_COUNT = 15;
  public inner_width = 290;

  private currentRow: string;

  constructor( private data: InputNodesService,
              private helper: DataHelperModule,
              private app: AppComponent,
              private three: ThreeService) {

    this.currentRow = null;

  }

  ngOnInit() {
    this.ROWS_COUNT = this.rowsCount();
    // three.js にモードの変更を通知する
    this.three.ChangeMode("nodes");
  }

  // 指定行row 以降のデータを読み取る
  private loadData(row: number): void {
    for (let i = this.dataset.length + 1; i <= row; i++) {
      const node = this.data.getNodeColumns(i);
      this.dataset.push(node);
    }
  }

  // 表の高さを計算する
  private tableHeight(): string {
    const containerHeight = this.app.getDialogHeight();
    return containerHeight.toString();
  }
  // 表高さに合わせた行数を計算する
  private rowsCount(): number {
    const containerHeight = this.app.getDialogHeight();
    return Math.round(containerHeight / 30);
  }

  // グリッドの設定
  options: pq.gridT.options = {
    showTop: false,
    reactive: true,
    sortable: false,
    locale: "jp",
    height: this.tableHeight(),
    numberCell: {
      show: true, // 行番号
      width:45
    },
    colModel: (this.helper.dimension === 3) ? this.columnHeaders3D : this.columnHeaders2D,
    dataModel: {
      data: this.dataset
    },
    beforeTableView: (evt, ui) => {
      const finalV = ui.finalV;
      const dataV = this.dataset.length;
      if (ui.initV == null) {
          return;
      }
      if (finalV >= dataV - 1) {
        this.loadData(dataV + this.ROWS_COUNT);
        this.grid.refreshDataAndView();
      }
    },
    selectEnd: (evt, ui) => {
      const range = ui.selection.iCells.ranges;
      const row = range[0].r1 + 1;
      const column = this.columnKeys[range[0].c1];
      if (this.currentRow !== row){
        //選択行の変更があるとき，ハイライトを実行する
        this.three.selectChange('nodes', row, '');
      }
      this.currentRow = row;
    },
    change: (evt, ui) => {
      const changes = ui.updateList;
      // copy&pasteで入力した際、超過行が消えてしまうため、addListのループを追加.
      for (const target of ui.addList) {
        const no: number = target.rowIndx;
        const node = this.data.getNodeColumns(no + 1);
        node['x'] = (target.newRow.x !== undefined) ? target.newRow.x : '';
        node['y'] = (target.newRow.y !== undefined) ? target.newRow.y : '';
        node['z'] = (target.newRow.z !== undefined) ? target.newRow.z : '';
        this.dataset.splice(no, 1, node)
      }
      this.three.changeData('nodes');

      // ハイライト処理を再度実行する
      const row = changes[0].rowIndx + 1;
      this.three.selectChange("nodes", row, '');
      }
  };

  width = (this.helper.dimension === 3) ? 380 : 290 ;

}
