import { NgModule } from "@angular/core";
import { ElectronService } from "ngx-electron";

@NgModule({
  imports: [],
  exports: [],
})
export class DataHelperModule {

  constructor(
    public electronService: ElectronService
  ) {}

  // ３次元解析=3, ２次元解析=2
  public dimension: number;
  public isContentsDailogShow: boolean;

  // アラートを表示する
  public alert(message: string): void{
    if(this.electronService.isElectronApp) {
      this.electronService.ipcRenderer.sendSync('alert', message);
    }else{
      alert(message);
    }
  }

  // 文字列string を数値にする
  public toNumber(num: string, digit: number = null): number {
    let result: number = null;
    try {
      const tmp: string = num.toString().trim();
      if (tmp.length > 0) {
        result = ((n: number) => (isNaN(n) ? null : n))(+tmp);
      }
    } catch {
      result = null;
    }
    if (digit != null) {
      const dig: number = 10 ** digit;
      result = Math.round(result * dig) / dig;
    }
    return result;
  }
  
  // 文字列の配列を数字の小さい順に並べ替える
  public numberSort(strList: string[]): string[]{
    // 数値型の配列に変換する
    const toNumbers = strList.map(Number);
    
    toNumbers.sort((a, b) => {
      return a - b
    })

    return toNumbers.map(String);
  }



  // ２つのオブジェクトが同じものかどうか判定する
  public objectEquals(a: any, b: any): boolean {
    if (a === b) {
      // 同一インスタンスならtrueを返す
      return true;
    }

    // 比較対象双方のキー配列を取得する（順番保証のためソートをかける）
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();

    // 比較対象同士のキー配列を比較する
    if (aKeys.toString() !== bKeys.toString()) {
      // キーが違う場合はfalse
      return false;
    }

    // 値をすべて調べる。
    const wrongIndex = aKeys.findIndex(function (value) {
      // 注意！これは等価演算子で正常に比較できるもののみを対象としています。
      // つまり、ネストされたObjectやArrayなどには対応していないことに注意してください。
      return a[value] !== b[value];
    });

    // 合致しないvalueがなければ、trueを返す。
    return wrongIndex === -1;
  }

  public table_To_text(wTABLE) {
    var wRcString = "";
    var wTR = wTABLE.rows;
    for (var i = 0; i < wTR.length; i++) {
      var wTD = wTABLE.rows[i].cells;
      var wTR_Text = "";
      for (var j = 0; j < wTD.length; j++) {
        const a: string = wTD[j].innerText;
        const b = a.replace(" ", "");
        const c = b.replace("\n", "");
        wTR_Text += c;
        if (j === wTD.length - 1) {
          wTR_Text += "";
        } else {
          wTR_Text += "\t";
        }
      }
      wRcString += wTR_Text + "\r\n";
    }
    return wRcString;
  }

  // ファイル名から拡張子を取得する関数
  public getExt(filename: string): string {
    const pos = filename.lastIndexOf('.');
    if (pos === -1) {
      return '';
    }
    const ext = filename.slice(pos + 1);
    return ext.toLowerCase();
  }

  public getScale(data: number, max: number): number {

    const ratio = 1 * Math.abs(data) / max;
    return ratio;
    
    // 円を用いた倍率を設定する
    const scale = ( 1 - ( ratio - 1)**2 )**0.5; 
    return scale;
  }

  public getCircleScale(data: number, max: number): number {

    const ratio = 1 * Math.abs(data) / max;
    
    // 円を用いた倍率を設定する
    const scale = ( 1 - ( ratio - 1)**2 )**0.5; 
    return scale;
  }

}
