// import { ChartOptions } from './../../html-chart/chart-uplot/chart-uplot.component';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.css']
})
export class LineComponent implements OnInit {

    @Input() lineChartData: any;
    // chartDom: HTMLElement | undefined;
    // myChart: echarts.ECharts | undefined;
    chartOpt: any;
    chartOption = LineComponent.DefaultOptions();

    constructor() { }
    // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
    ngOnChanges(changes: SimpleChanges): void {
      const { lineChartData } = changes;
    }

    ngOnInit(): void {
        console.log('line component create ......');
    }

    onChartInit(event: any) {
      this.chartOpt = event;
      this.chartOpt.clear();
      this.chartOpt.setOption(LineComponent.DefaultOptions(), true);
    }


    public static DefaultOptions() {
        let chartOption = {
            title: {
                text: 'xxx',
                left: 'center'
            },
            xAxis: {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    data: [150, 230, 224, 218, 135, 147, 260],
                    type: 'line'
                }
            ]
        };
        return chartOption;
    }

    setOptions(options: EChartsOption): void {
        setTimeout(() => {
            this.chartOpt.clear();
            this.chartOpt.setOption({...LineComponent.DefaultOptions(),...options}, true);
        }, 0);
    }


}
