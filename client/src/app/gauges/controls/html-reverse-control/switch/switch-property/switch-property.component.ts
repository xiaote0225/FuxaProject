import { Component, OnInit, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { SwitchComponent } from '../switch.component';

@Component({
  selector: 'app-switch-property',
  templateUrl: './switch-property.component.html',
  styleUrls: ['./switch-property.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SwitchPropertyComponent implements OnInit {
    @Input() data: any;
    @Output() onPropChanged: EventEmitter<any> = new EventEmitter();
    @Input('reload') set reload(b: any) {
        this._reload();
    }

    options: any;

    constructor() {
    }

    ngOnInit() {
        if (!this.data.settings.property) {
            this.data.settings.property = SwitchComponent.DefaultOptions();
        }
        this._reload();
    }

    onPropertyChanged() {
        this.onPropChanged.emit(this.data.settings);
    }

    private _reload() {
        if (!this.data.settings.property) {
            this.data.settings.property = SwitchComponent.DefaultOptions();
        }
        this.options = this.data.settings.property;
    }


}
