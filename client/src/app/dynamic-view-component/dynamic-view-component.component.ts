import { takeUntil } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';

import { Hmi, View } from '../_models/hmi';
import { GaugesManager } from '../gauges/gauges.component';
import { ProjectService } from '../_services/project.service';
import { FuxaViewComponent } from '../fuxa-view/fuxa-view.component';

@Component({
  selector: 'app-dynamic-view-component',
  templateUrl: './dynamic-view-component.component.html',
  styleUrls: ['./dynamic-view-component.component.css']
})
export class DynamicViewComponentComponent implements OnInit,OnDestroy,AfterViewInit {

    currentView: View = new View();
    hmi: Hmi = new Hmi();
    currentViewName = '';
    backgroudColor = 'unset';

    @ViewChild('fuxaview', { static: true }) fuxaview: FuxaViewComponent;

    destroy$ = new Subject<void>();

    private loadHmi(currentViewName: string) {
        let hmi = this.projectService.getHmi();
        if (hmi) {
            this.hmi = hmi;
        }
        if (this.hmi && this.hmi.views && this.hmi.views.length > 0) {
            let viewToShow = null;
            if (this.hmi.layout && currentViewName) {
                viewToShow = this.hmi.views.find(x => x.name === currentViewName);
            }
            if (!viewToShow) {
                viewToShow = this.hmi.views[0];
            }
            this.currentView = viewToShow;
            this.setBackground();
        }
        this.cdr.markForCheck();

        if (this.currentView && this.fuxaview) {
            this.fuxaview.hmi.layout = this.hmi.layout;
            this.fuxaview.loadHmi(this.currentView);
        }
    }

    private setBackground() {
        if (this.currentView && this.currentView.profile) {
            this.backgroudColor = this.currentView.profile.bkcolor;
        }
    }

    constructor(public activatedRoute: ActivatedRoute,public gaugesManager: GaugesManager,private projectService: ProjectService,private cdr: ChangeDetectorRef) {
        console.log('constructor fuxaview',this.fuxaview);
    }

    ngOnInit(): void {
        console.log('ngOnInit fuxaview',this.fuxaview);
        this.activatedRoute.params.pipe(
            takeUntil(this.destroy$)
        ).subscribe(({currentViewName}) => this.currentViewName = currentViewName);


        this.projectService.onLoadHmi.subscribe(load => {
            let hmi = this.projectService.getHmi();
            if (hmi) {
                this.loadHmi(this.currentViewName);
            }
        }, error => {
            console.error(`Error loadHMI: ${error}`);
        });

    }

    ngAfterViewInit(): void {
        console.log('ngAfterViewInit fuxaview',this.fuxaview);
        try {
            setTimeout(() => {
                this.projectService.notifyToLoadHmi();
            }, 0);
        }
        catch (err) {
            console.error(err);
        }
    }


    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
