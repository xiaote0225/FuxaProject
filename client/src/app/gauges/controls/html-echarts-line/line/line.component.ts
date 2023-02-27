import { ChangeDetectorRef, ViewChild, ElementRef, Renderer2, ViewContainerRef } from '@angular/core';
// import { ChartOptions } from './../../html-chart/chart-uplot/chart-uplot.component';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { map } from 'rxjs/operators';
// import { EChartsOption } from 'echarts';

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

    currentTimeout = null;
    currentInterval = null;


    @ViewChild('lineChartDiv',{static:false}) divTemplate: ElementRef;

    constructor(private http: HttpClient,private cdr: ChangeDetectorRef,private rd2: Renderer2,private viewref: ViewContainerRef) { }
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

    resize(height?, width?) {
        if (height && width) {
            this.rd2.setStyle(this.divTemplate.nativeElement,'width',width+'px');
            this.rd2.setStyle(this.divTemplate.nativeElement,'height',height+'px');
        }
    }


    public static DefaultOptions() {
        let chartOption = {
            title: {
                text: '',
                left: 'center'
            },
            xAxis: {
                type: 'category',
                data: []
            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    data: [],
                    type: 'line'
                }
            ],
            url: '',
            polling: 3
        };
        return chartOption;
    }

    setOptions(options: any): void {
        const {polling,url,title} = options;
        if(this.currentTimeout){
            clearTimeout(this.currentTimeout);
        }
        this.currentTimeout = setTimeout(() => {
            this.chartOpt.clear();
            this.chartOpt.setOption({...LineComponent.DefaultOptions(),...options}, true);
        }, 10);
        if(url !== '' && polling != ''){
            if(this.currentInterval){
                clearInterval(this.currentInterval);
            }
            this.currentInterval = setInterval(() => {
                this.chartOpt.clear();
                let obj = LineComponent.DefaultOptions();
                this.getData(url).subscribe(val => {
                    obj.title.text = title.text;
                    obj.xAxis.data = val.product1.date;
                    obj.series[0].data = val.product1.plan;
                    this.chartOpt.setOption({...obj}, true);
                });
            },+(polling + '000'));
        }
    }

    getData(url){
        return this.http.get<any>(url).pipe(
            map(data => data.data)
        );
    }


}
