import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, Renderer2 } from '@angular/core';
import pq from 'pqgrid';
import { DataHelperModule } from "src/app/providers/data-helper.module";

//import few localization files for this demo.
import 'pqgrid/localize/pq-localize-en.js';
import 'pqgrid/localize/pq-localize-ja.js';

@Component({
  selector: 'app-sheet',
  templateUrl: './sheet.component.html',
  styleUrls: ['./sheet.component.scss']
})
export class SheetComponent implements AfterViewInit, OnChanges {

  @ViewChild('pqgrid') div: ElementRef;
  @Input() options: any;

  grid: pq.gridT.instance = null;

  constructor(
    public helper: DataHelperModule,
  ) {
  }

  private createGrid() {
    this.options.beforeCellKeyDown = (evt, ui) => {
      let mov = 1;
      /*
      // Shiftを押したら左に動く
      if (evt.shiftKey === true){
        mov = -1;
      }
      */
      if (evt.key === 'Enter') {
        const $cell = this.grid.getCell({
          rowIndx: ui.rowIndx,
          colIndx: ui.colIndx + mov,
        });

        if ($cell.length > 0) {
          // 右に移動
          this.grid.setSelection({
            rowIndx: ui.rowIndx,
            colIndx: ui.colIndx + mov,
            focus: true,
          });
        } else {
          // 次の行の左端に移動
          this.grid.setSelection({
            rowIndx: ui.rowIndx + mov,
            colIndx: 0,
            focus: true,
          });
        }
        return false;
      }

      return true;
    };

    this.grid = pq.grid(this.div.nativeElement, this.options);
  }

  ngOnChanges(obj: SimpleChanges) {
    //debugger;
    if (!obj.options.firstChange) {//grid is destroyed and recreated only when whole options object is changed to new reference.
      this.grid.destroy();
      this.createGrid();
    }
  }

  ngAfterViewInit() {
    this.createGrid();
  }

  refreshDataAndView() {
    if (this.grid === null) {
      return;
    }
    this.grid.refreshDataAndView();
    console.log('refreshDataAndView');

  }


}
