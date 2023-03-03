import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ChangeDetectionStrategy, ViewChild, ElementRef, ChangeDetectorRef, Renderer2, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-switch',
  templateUrl: './switch.component.html',
  styleUrls: ['./switch.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SwitchComponent implements OnInit {
    urlPath: any;
    checked = false;

    @ViewChild('switchToggle',{static:false}) divTemplate: ElementRef;

    toggleChange(){
        const subScribe = this.http.put<any>(`${this.urlPath}`, { flag: !this.checked}).subscribe(
            val => {
                subScribe.unsubscribe();
            },
            error => {
                subScribe.unsubscribe();
                setTimeout(() => {
                    this.checked = !this.checked;
                    this.cdr.markForCheck();
                },1000);
            },
            () => {
                setTimeout(() => {
                    subScribe.unsubscribe();
                }, 0);
        });
    }

    constructor(private http: HttpClient,private cdr: ChangeDetectorRef,private rd2: Renderer2,private viewref: ViewContainerRef) { }

    ngOnInit(): void {
        console.log('switch component create ......');
        // setInterval(() => {
        //     this.checked = !this.checked;
        //     console.log('this.checked',this.checked);
        //     this.cdr.markForCheck();
        // },2000);
    }

    public static DefaultOptions() {
        let switchOptions = {
            urlPath: ''
        };
        return switchOptions;
    }

    setOptions(property: any): void {
        this.urlPath = property.urlPath;
    }

    resize(height?, width?) {
        if (height && width) {
            this.rd2.setStyle(this.divTemplate.nativeElement,'width',width+'px');
            this.rd2.setStyle(this.divTemplate.nativeElement,'height',height+'px');
        }
    }
}
