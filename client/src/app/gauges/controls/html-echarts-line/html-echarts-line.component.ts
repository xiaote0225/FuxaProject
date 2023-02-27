import { Component, ChangeDetectionStrategy, ComponentFactoryResolver, ViewContainerRef } from '@angular/core';

import { Utils } from '../../../_helpers/utils';
import { GaugeSettings } from '../../../_models/hmi';
import { GaugeDialogType } from '../../gauge-property/gauge-property.component';
import { GaugeBaseComponent } from './../../gauge-base/gauge-base.component';
import { LineComponent } from './line/line.component';

@Component({
    selector: 'app-html-echarts-line',
    templateUrl: './html-echarts-line.component.html',
    styleUrls: ['./html-echarts-line.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HtmlEchartsLineComponent extends GaugeBaseComponent {
    static TypeTag = 'svg-ext-own_ctrl-echarts-line';
    static LabelTag = 'HtmlEchartsLine';
    static prefixD = 'D-OXC_';

    constructor() {
        super();
    }

    static getDialogType(): GaugeDialogType {
        return GaugeDialogType.EchartsLine;
    }

    static initElement(gaugeSettings: GaugeSettings, resolver: ComponentFactoryResolver, viewContainerRef: ViewContainerRef, isview: boolean) {
        let ele = document.getElementById(gaugeSettings.id);
        if (ele) {
            let svgEchartsLineContainer = Utils.searchTreeStartWith(ele, this.prefixD);
            if (svgEchartsLineContainer) {
                let factory = resolver.resolveComponentFactory(LineComponent);
                const componentRef = viewContainerRef.createComponent(factory);
                svgEchartsLineContainer.innerHTML = '';
                componentRef.changeDetectorRef.detectChanges();
                // let iframe = document.createElement('div');
                // iframe.innerHTML = 'cyaiDiv';
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
        return HtmlEchartsLineComponent.initElement(gab, res, ref, false);
    }
}
