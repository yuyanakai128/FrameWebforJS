import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { InputFixNodeService } from "../components/input/input-fix-node/input-fix-node.service";
import { DataHelperModule } from "./data-helper.module";

@Injectable({
  providedIn: "root",
})
export class LanguagesService {
  public browserLang: string;
  public languageIndex = {
    ja: "日本語",
    en: "English",
    cn: "中文"
  };

  constructor(
    public translate: TranslateService,
    private inputFixNode: InputFixNodeService,
    public helper: DataHelperModule
  ) {
    this.browserLang = translate.getBrowserLang();
    translate.use(this.browserLang);
  }

  public trans(key: string) {
    this.browserLang = key;
    this.translate.use(this.browserLang);
    this.helper.isContentsDailogShow = false;
  }
}
