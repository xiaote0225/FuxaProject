import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LineComponent } from '../line.component';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-line-property',
  templateUrl: './line-property.component.html',
  styleUrls: ['./line-property.component.css']
})
export class LinePropertyComponent implements OnInit {

    @Input() data: any;
    @Output() onPropChanged: EventEmitter<any> = new EventEmitter();
    @Input('reload') set reload(b: any) {
        this._reload();
    }


    options: EChartsOption;

    constructor(private translateService: TranslateService) {
    }

    ngOnInit() {
        if (!this.data.settings.property) {
            this.data.settings.property = LineComponent.DefaultOptions();
        }
        this._reload();
    }

    onPropertyChanged() {
        this.onPropChanged.emit(this.data.settings);
    }

    private _reload() {
        if (!this.data.settings.property) {
            this.data.settings.property = LineComponent.DefaultOptions();
        }
        this.options = this.data.settings.property;
    }

}
