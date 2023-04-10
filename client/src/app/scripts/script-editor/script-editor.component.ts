/* eslint-disable @angular-eslint/component-class-suffix */
import { Component, OnInit, Inject, ViewChild, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';

import { HmiService } from '../../_services/hmi.service';
import { ScriptService } from '../../_services/script.service';
import { EditNameComponent } from '../../gui-helpers/edit-name/edit-name.component';
import { TranslateService } from '@ngx-translate/core';
import { Utils } from '../../_helpers/utils';
import { DeviceTagDialog } from '../../device/device.component';
import { ScriptParamType, Script, ScriptTest, SCRIPT_PREFIX, SystemFunctions, SystemFunction, ScriptParam, ScriptConsoleMessage } from '../../_models/script';
import { DevicesUtils, DeviceType } from '../../_models/device';

@Component({
    selector: 'app-script-editor',
    templateUrl: './script-editor.component.html',
    styleUrls: ['./script-editor.component.css']
})
export class ScriptEditorComponent implements OnInit, OnDestroy {
    @ViewChild(CodemirrorComponent, {static: false}) CodeMirror: CodemirrorComponent;
    codeMirrorContent: string;
    codeMirrorOptions = {
        lineNumbers: true,
        theme: 'material',
        mode: 'javascript',
        // lineWrapping: true,
        // foldGutter: true,
        // gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
        // gutters: ["CodeMirror-lint-markers"],
        // lint: {options: {esversion: 2021}},
        lint: true,
    };
    systemFunctions = new SystemFunctions();
    checkSystemFnc = this.systemFunctions.functions.map(sf => sf.name);
    parameters: ScriptParam[] = [];
    testParameters: ScriptParam[] = [];
    tagParamType = Utils.getEnumKey(ScriptParamType, ScriptParamType.tagid);

    console: string[] = [];
    script: Script;
    msgRemoveScript = '';
    ready = false;
    private subscriptionScriptConsole: Subscription;

    constructor(public dialogRef: MatDialogRef<ScriptEditorComponent>,
        public dialog: MatDialog,
        private changeDetector: ChangeDetectorRef,
        private translateService: TranslateService,
        private hmiService: HmiService,
        private scriptService: ScriptService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
            this.script = data.script;
            this.dialogRef.afterOpened().subscribe(() => setTimeout(() => {this.ready = true; this.setCM();}, 0));
        }

    ngOnInit() {
        if (!this.script) {
            this.script = new Script(Utils.getGUID(SCRIPT_PREFIX));
        }
        this.parameters = this.script.parameters;
        this.codeMirrorContent = this.script.code;
        this.translateService.get('msg.script-remove', { value: this.script.name }).subscribe((txt: string) => { this.msgRemoveScript = txt; });
        this.systemFunctions.functions.forEach(fnc => {
            this.translateService.get(fnc.text).subscribe((txt: string) => { fnc.text = txt; });
            this.translateService.get(fnc.tooltip).subscribe((txt: string) => { fnc.tooltip = txt; });
        });
        this.subscriptionScriptConsole = this.hmiService.onScriptConsole.subscribe((scriptConsole: ScriptConsoleMessage) => {
            this.console.push(scriptConsole.msg);
        });
        this.loadTestParameter();
    }

    ngOnDestroy() {
        try {
            if (this.subscriptionScriptConsole) {
                this.subscriptionScriptConsole.unsubscribe();
            }
        } catch (e) {
            console.error(e);
        }
    }

    setCM() {
        this.changeDetector.detectChanges();
        this.CodeMirror?.codeMirror?.refresh();
        let spellCheckOverlay = {
            token: (stream) => {
                for (let i = 0; i < this.checkSystemFnc.length; i++) {
                    if (stream.match(this.checkSystemFnc[i])) {
                        return 'system-function';
                    }
                }
                while (stream.next() != null && this.checkSystemFnc.indexOf(stream) !== -1) {}
                return null;
            }
        };
        this.CodeMirror?.codeMirror?.addOverlay(spellCheckOverlay);
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onOkClick(): void {
        this.dialogRef.close(this.script);
    }

    getParameters() {
        return '';
    }

    isValid() {
        if (this.script && this.script.name) {
            return true;
        }
        return false;
    }

    onEditScriptName() {
        let title = 'dlg.item-title';
        let label = 'dlg.item-req-name';
        let error = 'dlg.item-name-error';
        let exist = this.data.scripts.map((s) => s.name);
        this.translateService.get(title).subscribe((txt: string) => { title = txt; });
        this.translateService.get(label).subscribe((txt: string) => { label = txt; });
        this.translateService.get(error).subscribe((txt: string) => { error = txt; });
        let dialogRef = this.dialog.open(EditNameComponent, {
            position: { top: '60px' },
            data: { name: this.script.name, title: title, label: label, exist: exist, error: error, validator: this.validateName }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result && result.name && result.name.length > 0) {
                this.script.name = result.name;
            }
        });
    }

    onAddFunctionParam() {
        let error = 'dlg.item-name-error';
        let exist = this.parameters.map(p => p.name);
        let dialogRef = this.dialog.open(DialogScriptParam, {
            position: { top: '60px' },
            data: { name: '', exist: exist, error: error, validator: this.validateName  }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.name && result.type) {
                this.parameters.push(new ScriptParam(result.name, result.type));
                this.loadTestParameter();
            }
        });
    }

    onRemoveParameter(index) {
        this.parameters.splice(index, 1);
        this.loadTestParameter();
    }

    onEditorContent(event) {
        this.script.code = this.codeMirrorContent;
    }

    onAddSystemFunction(sysfnc: SystemFunction) {
        if (sysfnc.params.filter((value) => value).length === 1) {
            this.onAddSystemFunctionTag(sysfnc);
        } else {
            this.insertText(this.getFunctionText(sysfnc, '\'MainView\''));
        }
    }

    onAddSystemFunctionTag(sysfnc: SystemFunction) {
        let dialogRef = this.dialog.open(DeviceTagDialog, {
            position: { top: '60px' },
            data: {
                variableId: null,
                devices: this.data.devices,
                multiSelection: false,
                deviceFilter: [ DeviceType.internal ]
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.variableId) {
                let tag = { id: result.variableId, comment: DevicesUtils.getDeviceTagText(this.data.devices, result.variableId) };
                let text = this.getTagFunctionText(sysfnc, [tag]);
                this.insertText(text);
            }
        });
    }

    onSetTestTagParam(param: ScriptParam) {
        let dialogRef = this.dialog.open(DeviceTagDialog, {
            position: { top: '60px' },
            data: {
                variableId: null,
                devices: this.data.devices,
                multiSelection: false,
                deviceFilter: [ DeviceType.internal ]
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.variableId) {
                param.value = result.variableId;
            }
        });
    }

    onRunTest() {
        let torun = new ScriptTest(this.script.id, this.script.name);
        torun.parameters = this.testParameters;
        torun.outputId = this.script.id;
        torun.code = this.script.code;
        this.scriptService.runScript(torun).subscribe(result => {

        }, err => {
            this.console.push((err.message) ? err.message : err);
        });
    }

    onConsoleClear() {
        this.console = [];
    }

    private validateName(name: string) {
        let regName = /^[a-zA-Z]*$/;
        return regName.test(name);
    }

    private insertText(text: string) {
        let doc = this.CodeMirror.codeMirror.getDoc();
        var cursor = doc.getCursor(); // gets the line number in the cursor position
        doc.replaceRange(text, cursor);
    }

    private getTagFunctionText(sysfnc: SystemFunction, params: any[]): string {
        let paramText = '';
        for (let i = 0; i < sysfnc.params.length; i++) {
            if (paramText.length) {     // parameters separator
                paramText += ', ';
            }
            if (sysfnc.params[i] && params[i]) {         // tag ID
                paramText += `'${params[i].id}' /* ${params[i].comment} */`;
            } else {
                paramText += '';
            }
        }
        return `${sysfnc.name}(${paramText});`;
    }

    private getFunctionText(sysfnc: SystemFunction, param: string): string {
        return `${sysfnc.name}(${param});`;
    }

    private loadTestParameter() {
        let params = [];
        for (let i = 0; i < this.parameters.length; i++) {
            let p = new ScriptParam(this.parameters[i].name, this.parameters[i].type);
            if (this.testParameters[i]) {
                p.value = this.testParameters[i].value;
            }
            params.push(p);
        }
        this.testParameters = params;
    }
}

@Component({
    selector: 'dlg-sript-param',
    templateUrl: 'param.dialog.html',
})
export class DialogScriptParam {
    error = '';
    existError = 'script.param-name-exist';
    paramType = ScriptParamType;
    constructor(public dialogRef: MatDialogRef<DialogScriptParam>,
        private translateService: TranslateService,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        Object.keys(this.paramType).forEach(key => {
            this.translateService.get(this.paramType[key]).subscribe((txt: string) => {this.paramType[key] = txt;});
        });
        this.translateService.get(this.existError).subscribe((txt: string) => {this.existError = txt;});
    }

    onNoClick(): void {
        this.dialogRef.close();

    }

    isValid(name): boolean {
        if (this.data.validator && !this.data.validator(name)) {return false;}
        if (!this.data.type) {return false;}
        if (!this.data.name) {return false;}
        return (this.data.exist.find((n) => n === name)) ? false : true;
    }

    onCheckValue(input: any) {
        if (this.data.exist && this.data.exist.length && input.target.value) {
            if (this.data.exist.find((n) => n === input.target.value)) {
                this.error = this.existError;
                return;
            }
        }
        this.error = '';
    }
}
