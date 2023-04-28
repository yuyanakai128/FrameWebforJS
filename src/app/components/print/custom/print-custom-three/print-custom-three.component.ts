import { Component, OnInit } from "@angular/core";
import { DataHelperModule } from "src/app/providers/data-helper.module";
import { ResultDataService } from "src/app/providers/result-data.service";
import { PrintCustomThreeService } from "./print-custom-three.service";

@Component({
  selector: "app-print-custom-three",
  templateUrl: "./print-custom-three.component.html",
  styleUrls: [
    "../../../../app.component.scss",
    "./print-custom-three.component.scss",
    "../print-custom.component.scss",
  ],
})
export class PrintCustomThreeComponent implements OnInit {
  
  constructor(
    public printCustomThreeService: PrintCustomThreeService,
    public ResultData: ResultDataService,
    public helper: DataHelperModule
  ) {}

  ngOnInit(): void {
  }

  selectRadio(value: string){
    // 2次元で印刷する場合のレイアウト
    /// splitHorizontal: 上, 下,
    /// splitVertical: 左, 右,
    /// single: シングル
    this.printCustomThreeService.print2DThreeLayout = value;
  }

}
