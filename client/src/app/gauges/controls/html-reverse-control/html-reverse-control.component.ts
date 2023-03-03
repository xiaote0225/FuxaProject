import { Component, ChangeDetectionStrategy, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';

import { Utils } from '../../../_helpers/utils';
import { GaugeSettings } from '../../../_models/hmi';
import { GaugeBaseComponent } from '../../gauge-base/gauge-base.component';
import { GaugeDialogType } from '../../gauge-property/gauge-property.component';
import { SwitchComponent } from './switch/switch.component';

@Component({
  selector: 'app-html-reverse-control',
  templateUrl: './html-reverse-control.component.html',
  styleUrls: ['./html-reverse-control.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HtmlReverseControlComponent extends GaugeBaseComponent {
    static TypeTag = 'svg-ext-own_ctrl-reverse-control';
    static LabelTag = 'HtmlReverseControl';
    static prefixD = 'D-OXC_';

    constructor() {
        super();
    }

    static getDialogType(): GaugeDialogType {
        return GaugeDialogType.ReverseControl;
    }

    static initElement(gaugeSettings: GaugeSettings, resolver: ComponentFactoryResolver, viewContainerRef: ViewContainerRef, isview: boolean) {
        let ele = document.getElementById(gaugeSettings.id);
        if (ele) {
            let svgEchartsLineContainer = Utils.searchTreeStartWith(ele, this.prefixD);
            if (svgEchartsLineContainer) {
                let factory = resolver.resolveComponentFactory(SwitchComponent);
                const componentRef = viewContainerRef.createComponent(factory);
                svgEchartsLineContainer.innerHTML = '';
                componentRef.changeDetectorRef.detectChanges();
                // iframe.style['width'] = '100%';
                // iframe.style['height'] = '100%';
                // iframe.style['border'] = 'none';
                // iframe.style['background-color'] = '#F1F3F4';
                // iframe.setAttribute('title', 'iframe');
                // if (gaugeSettings.property.address) {
                //     iframe.setAttribute('src', gaugeSettings.property.address);
                // }
                svgEchartsLineContainer.appendChild(componentRef.location.nativeElement);
                componentRef.instance.resize(svgEchartsLineContainer.clientHeight, svgEchartsLineContainer.clientWidth);
                componentRef.instance['myComRef'] = componentRef;
                return componentRef.instance;
            }
        }
    }

    static detectChange(gab: GaugeSettings, res: any, ref: any) {
        return HtmlReverseControlComponent.initElement(gab, res, ref, false);
    }

}
