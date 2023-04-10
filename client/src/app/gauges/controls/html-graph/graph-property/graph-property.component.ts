import { Component, EventEmitter, OnInit, Input, Output, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntypedFormControl } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject, ReplaySubject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { Graph, GraphType, GraphRangeType, GraphBarXType, GraphDateGroupType } from '../../../../_models/graph';
import { GraphConfigComponent } from '../../../../editor/graph-config/graph-config.component';
import { GraphBarComponent } from '../graph-bar/graph-bar.component';
import { GraphOptions, GraphThemeType } from '../graph-base/graph-base.component';
import { GaugeGraphProperty } from '../../../../_models/hmi';
import { Utils } from '../../../../_helpers/utils';

@Component({
    selector: 'app-graph-property',
    templateUrl: './graph-property.component.html',
    styleUrls: ['./graph-property.component.css']
})
export class GraphPropertyComponent implements OnInit, OnDestroy {

    @Input() data: any;
    @Output() onPropChanged: EventEmitter<any> = new EventEmitter();
    @Input('reload') set reload(b: any) {
        this._reload();
    }

    themeType = GraphThemeType;
    graphBarType = GraphType.bar;
    graphType: GraphType = GraphType.pie;
    options: GraphOptions;
    defaultColor = Utils.defaultColor;
    lastRangeType = GraphRangeType;
    dateGroupType = GraphDateGroupType;
    dataXType = Utils.getEnumKey(GraphBarXType, GraphBarXType.date);

    graphCtrl: UntypedFormControl = new UntypedFormControl();
    graphFilterCtrl: UntypedFormControl = new UntypedFormControl();
    public filteredGraph: ReplaySubject<Graph[]> = new ReplaySubject<Graph[]>(1);

    private _onDestroy = new Subject<void>();

    constructor(
        public dialog: MatDialog,
        private translateService: TranslateService) {
        }

    ngOnInit() {
        if (this.data.settings.type.endsWith('bar')) {
            this.graphType = GraphType.bar;
            if (!this.data.settings.property) {
                this.data.settings.property = <GaugeGraphProperty>{ id: null, type: null, options: null };
            }
            if (!this.data.settings.property.options) {
                this.data.settings.property.options = GraphBarComponent.DefaultOptions();
            }
            Object.keys(this.lastRangeType).forEach(key => {
                this.translateService.get(this.lastRangeType[key]).subscribe((txt: string) => { this.lastRangeType[key] = txt; });
            });
            Object.keys(this.dateGroupType).forEach(key => {
                this.translateService.get(this.dateGroupType[key]).subscribe((txt: string) => { this.dateGroupType[key] = txt; });
            });
        }
        this._reload();
    }

    ngOnDestroy() {
        this._onDestroy.next();
        this._onDestroy.complete();
    }

    private _reload() {
        // check default value, undefined if new
        if (this.data.settings.type.endsWith('bar')) {
            this.graphType = GraphType.bar;
            if (!this.data.settings.property) {
                this.data.settings.property = <GaugeGraphProperty>{ id: null, type: null, options: null };
            }
            if (!this.data.settings.property.options) {
                this.data.settings.property.options = GraphBarComponent.DefaultOptions();
            }
        }
        this.options = this.data.settings.property.options;
        // load graphs list to choise
        this.loadGraphs();
        let graph = null;
        if (this.data.settings.property) {
            graph = this.data.graphs.find(graph => graph.id === this.data.settings.property.id);
        }
        this.graphCtrl.setValue(graph);
    }

    onGraphChanged() {
        this.data.settings.property = <GaugeGraphProperty>{ id: null, type: null, options: null };
        if (this.graphCtrl.value) {
            this.data.settings.property.id = this.graphCtrl.value.id;
            this.data.settings.property.type = this.graphCtrl.value.type;
            if (!this.isDateTime(this.graphCtrl.value)) {
                this.options.lastRange = null;
                this.options.dateGroup = null;
            } else {
                this.options.offline = true;
                this.options.lastRange = <GraphRangeType>Utils.getEnumKey(GraphRangeType, GraphRangeType.last1d);
                this.options.dateGroup = <GraphDateGroupType>Utils.getEnumKey(GraphDateGroupType, GraphDateGroupType.hours);
            }
        }
        if (this.options.theme === this.themeType.light) {
            this.options.scales['y'].ticks.color = '#666';
            this.options.scales['x'].ticks.color = '#666';
            this.options.plugins.legend.labels.color = '#666';
            this.options.plugins.title.color = '#666';
        } else if (this.options.theme === this.themeType.dark) {
            this.options.scales['y'].ticks.color = '#fff';
            this.options.scales['x'].ticks.color = '#fff';
            this.options.plugins.legend.labels.color = '#fff';
            this.options.plugins.title.color = '#fff';
        }

        const yScale = this.options.scales['y'];
        if(!yScale.hasOwnProperty('grid')) {
            yScale.grid = {};
        }

        yScale.grid.color = 'rgba(0, 0, 0, 0.1)';

        const xScale = this.options.scales['x'];
        if(!xScale.hasOwnProperty('grid')) {
            xScale.grid = {};
        }

        xScale.grid.color = 'rgba(0, 0, 0, 0.1)';

        this.data.settings.property.options = JSON.parse(JSON.stringify(this.options));
        this.onPropChanged.emit(this.data.settings);
    }

    onEditNewGraph() {
        let dialogRef = this.dialog.open(GraphConfigComponent, {
            position: { top: '60px' },
            minWidth: '1090px', width: '1090px',
            data: { type: (this.graphType === GraphType.bar) ? 'bar' : 'pie' }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.data.graphs = result;
                this.loadGraphs();
            }
        });
    }

    isDateTime(graph: Graph): boolean {
        if (graph && graph.property && graph.property.xtype === this.dataXType) {
            return true;
        }
        return false;
    }

    private loadGraphs(toset?: string) {
        // load the initial graph list
        this.filteredGraph.next(this.data.graphs.slice());
        // listen for search field value changes
        this.graphFilterCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
                this.filterGraph();
            });
        if (toset) {
            let idx = -1;
            this.data.graphs.every(function(value, index, _arr) {
                if (value.id === toset) {
                    idx = index;
                    return false;
                }
                return true;
            });
            if (idx >= 0) {
                this.graphCtrl.setValue(this.data.graphs[idx]);
            }
        }
    }

    private filterGraph() {
        if (!this.data.graphs) {
            return;
        }
        // get the search keyword
        let search = this.graphFilterCtrl.value;
        if (!search) {
            this.filteredGraph.next(this.data.graphs.slice());
            return;
        } else {
            search = search.toLowerCase();
        }
        // filter the variable
        this.filteredGraph.next(
            this.data.graphs.filter(graph => graph.name.toLowerCase().indexOf(search) > -1)
        );
    }
}
