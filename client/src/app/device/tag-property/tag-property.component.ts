import { Component, OnInit, OnDestroy, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { Device, TagType, Tag, DeviceType, ModbusTagType, BACnetObjectType, ServerTagType } from './../../_models/device';
import { TreetableComponent, Node, NodeType } from '../../gui-helpers/treetable/treetable.component';
import { HmiService } from '../../_services/hmi.service';
import { TranslateService } from '@ngx-translate/core';
import { Utils } from '../../_helpers/utils';

@Component({
    selector: 'app-tag-property',
    templateUrl: './tag-property.component.html',
    styleUrls: ['./tag-property.component.css']
})
export class TagPropertyComponent implements OnInit, OnDestroy {

    tagType: any;
    error: string;
    existing: string[] = [];
    TypeOfDialog = EditTagDialogType;
	dialogType = EditTagDialogType.Standard;
    config = { width: '100%', height: '600px', type: '' };
    memAddress = {'Coil Status (Read/Write 000001-065536)': '000000', 'Digital Inputs (Read 100001-165536)': '100000', 'Input Registers (Read  300001-365536)': '300000', 'Holding Registers (Read/Write  400001-465535)': '400000'};

    private subscriptionBrowse: Subscription;
    private subscriptionNodeAttribute: Subscription;
	private subscriptionDeviceWebApiRequest: Subscription;

    @ViewChild(TreetableComponent, {static: false}) treetable: TreetableComponent;

    constructor(
        private hmiService: HmiService,
        private translateService: TranslateService,
        public dialogRef: MatDialogRef<TagPropertyComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {

        this.tagType = TagType;
        if (this.isOpcua() || this.isBACnet() || this.isWebApi()) {
            this.dialogType = EditTagDialogType.Tree;
            this.config.height = '640px';
            this.config.width = '1000px';
            this.config.type = (this.isWebApi()) ? 'todefine' : '';
        } else if (this.isInternal()) {
            this.dialogType = EditTagDialogType.Simple;
        } else if (this.isServer()) {
            this.dialogType = EditTagDialogType.Simple;
            this.tagType = ServerTagType;
        } else {
            if (this.isModbus()) {
                this.tagType = ModbusTagType;
            }
            this.config.height = '0px';
            Object.keys(this.data.device.tags).forEach((key) => {
                let tag = this.data.device.tags[key];
                if (tag.id) {
                    if (tag.id !== this.data.tag.id) {
                        this.existing.push(tag.name);
                    }
                } else if (tag.name !== this.data.tag.name) {
                    this.existing.push(tag.name);
                }
            });
        }
    }

    ngOnInit() {
        if (this.dialogType === EditTagDialogType.Tree) {
            if (this.isOpcua() || this.isBACnet()) {
                this.subscriptionBrowse = this.hmiService.onDeviceBrowse.subscribe(values => {
                    if (this.data.device.id === values.device) {
                        if (values.error) {
                            this.addError(values.node, values.error);
                        } else {
                            this.addNodes(values.node, values.result);
                        }
                    }
                });
                this.subscriptionNodeAttribute = this.hmiService.onDeviceNodeAttribute.subscribe(values => {
                    if (this.data.device.id === values.device) {
                        if (values.error) {
                            //   this.addError(values.node, values.error);
                        } else if (values.node) {
                            if (values.node.attribute[14]) {    // datatype
                                values.node.type = values.node.attribute[14];
                            }
                            this.treetable.setNodeProperty(values.node, this.attributeToString(values.node.attribute));
                        }
                    }
                });
            } else if (this.isWebApi()) {
                this.hmiService.onDeviceWebApiRequest.subscribe(res => {
                    if (res.result) {
                        this.addTreeNodes(res.result);
                        this.treetable.update(false);
                    }
                });
        		this.hmiService.askWebApiProperty(this.data.device.property);
                return;
            }
            this.queryNext(null);
        }
    }

    ngOnDestroy() {
        // this.checkToSave();
        try {
            if (this.subscriptionBrowse) {
                this.subscriptionBrowse.unsubscribe();
            }
            if (this.subscriptionNodeAttribute) {
                this.subscriptionNodeAttribute.unsubscribe();
            }
            if (this.subscriptionDeviceWebApiRequest) {
				this.subscriptionDeviceWebApiRequest.unsubscribe();
			}
        } catch (e) {
        }
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    onOkClick(): void {
        this.data.nodes = [];
        if (this.isWebApi()) {
            let result = this.getSelectedTreeNodes(Object.values(this.treetable.nodes), null);
            result.forEach((n: Node) => {
                if (n.checked && n.enabled) {
                    this.data.nodes.push(n);
                }
            });
            // this.data.nodes = result;
        } else if (this.isModbus() || this.isSiemensS7() || this.isEthernetIp()) {
        } else if (this.isInternal() || this.isServer()) {
            let tags = <Tag[]>Object.values(this.data.device.tags);
            this.error = '';
            for (let i = 0; i < tags.length; i++) {
                if (tags[i].id !== this.data.tag.id && tags[i].name === this.data.tag.name) {
                    this.error = '';
                    this.translateService.get('msg.device-tag-exist').subscribe((txt: string) => { this.error = txt; });
                    return;
                }
            }
        } else {
            Object.keys(this.treetable.nodes).forEach((key) => {
                let n: Node = this.treetable.nodes[key];
                if (n.checked && n.enabled && (n.type || !n.childs || n.childs.length == 0)) {
                    this.data.nodes.push(this.treetable.nodes[key]);
                }
            });
        }
        this.dialogRef.close(this.data);
    }

    onCheckValue(tag) {
        if (this.existing.indexOf(tag.target.value) !== -1) {
            this.error = '';
            this.translateService.get('msg.device-tag-exist').subscribe((txt: string) => { this.error = txt; });
        } else {
            this.error = '';
        }
    }

    addNodes(parent: Node, nodes: any) {
        if (nodes) {
            let tempTags = Object.values(this.data.device.tags);
            nodes.forEach((n) => {
                let node = new Node(n.id, n.name);
                node.class = n.class;
                node.property = this.getProperty(n);
                if (this.isBACnet()) {
                    node.class = Node.strToType(n.class);
                    node.type = n.type;
                    var typetext = Object.values(BACnetObjectType)[n.type];
                    if (typetext) {
                        node.property = typetext;
                    }
                    // node.property = Object.keys(BACnetObjectType)[Object.values(BACnetObjectType).indexOf(n.type)] + '   ' + node.property;
                    // Object.keys(AlarmAckMode)[Object.values(AlarmAckMode).indexOf(AlarmAckMode.float)]
                }
                let enabled = true;
                if (node.class === NodeType.Variable) {
                    const selected = tempTags.find((t: Tag) => t.address === n.id);
                    if (selected) {
                        enabled = false;
                    }
                }
                this.treetable.addNode(node, parent, enabled);
                if (node.class === NodeType.Variable && this.data.device.type !== DeviceType.BACnet) {
                    this.hmiService.askNodeAttributes(this.data.device.id, n);
                }
            });
            this.treetable.update();
        }
    }

    addTreeNodes(nodes: any, id = '', parent: Node = null) {
        let nodeId = id;
        let nodeName = id;
        if (parent && parent.id) {
            nodeId = parent.id + ':' + nodeId;
        }
        let node = new Node(nodeId, nodeName);
        node.parent = parent;
        if (Array.isArray(nodes)) {
            // nodeId = nodeId + '[]';
            node.class = NodeType.Array;
            node.setToDefine();
            node.expanded = true;
            this.treetable.addNode(node, parent, true);
            let idx = 0;
            for(var n in nodes) {
                this.addTreeNodes(nodes[n], '[' + idx++ + ']', node);
            }
        } else if (nodes && typeof nodes === 'object') {
            // for(var n in nodes) {
            //     this.addTreeNodes(nodes[n], n, nodes);
            // }
            // let node = new Node(nodeId, nodeName);
            node.expanded = true;
            node.class = NodeType.Object;
            this.treetable.addNode(node, parent, true);
            for(var n in nodes) {
                this.addTreeNodes(nodes[n], n, node);
                if (parent) {
                    parent.addToDefine(n);
                }
            }
        } else {
            // let node = new Node(nodeId, nodeName);
            node.expandable = false;
            node.class = NodeType.Variable;
            node.childs = [];
            node.property = nodes;
            let enabled = true;
            const selected = Object.values(this.data.device.tags).find((t: Tag) => t.address === nodeId);
            if (node.parent && node.parent.parent && node.parent.parent.class === NodeType.Array) {
                node.class = NodeType.Item;
                if (!node.parent.parent.todefine.id && this.data.device.tags[nodeId] && this.data.device.tags[nodeId].options) {
                    node.parent.parent.todefine.id = this.data.device.tags[nodeId].options.selid;
                    node.parent.parent.todefine.value = this.data.device.tags[nodeId].options.selval;
                }
            } else if (selected) {
                enabled = false;
            }
            this.treetable.addNode(node, parent, enabled);
        }
    }

    getSelectedTreeNodes(nodes: Array<Node>, defined: any): Array<Node> {
        let result = [];
        for (let key in nodes) {
            let n: Node = nodes[key];
            if (n.class === NodeType.Array && n.todefine && n.todefine.id && n.todefine.value) {
                let arrayResult = this.getSelectedTreeNodes(n.childs, n.todefine);
                for (let ak in arrayResult) {
                    result.push(arrayResult[ak]);
                }
            } else if (n.class === NodeType.Object && defined && defined.id && defined.value) {
                // search defined attributes
                let childId = null, childValue = null;
                for (let childKey in n.childs)
                {
                    let child = n.childs[childKey];
                    if (child.text === defined.id) {
                        childId = child;
                    } else if (child.text === defined.value) {
                        childValue = child;
                    }
                }
                if (childId && childValue) {
                    let objNode = new Node(childId.id, childId.property);  // node array element (id: id:id, text: current id value)
                    objNode.class = NodeType.Reference;                     // to check
                    objNode.property = childValue.id;                        // value:id
                    objNode.todefine = { selid: childId.text, selval: childValue.text };
                    objNode.type = Utils.getType(childValue.property);
                    objNode.checked = true;
                    objNode.enabled = n.enabled;
                    const exist = Object.values(this.data.device.tags).find((tag: Tag) => tag.address === objNode.id && tag.memaddress === objNode.property);
                    if (exist) {
                        objNode.enabled = false;
                    }
                    result.push(objNode);
                }
            } else if (n.class === NodeType.Variable && n.checked) {
                // let objNode = new Node(n.id.split('>').join(''), n.text);
                let objNode = new Node(n.id, n.text);
                objNode.type = Utils.getType(n.property);
                objNode.checked = n.checked;
                objNode.enabled = n.enabled;
                result.push(objNode);
            }
        }
        return result;
    }

    getProperty(n: any) {
        if (n.class === 'Object') { // Object
            return '';
        } else if (n.class === 'Variable') {
            return 'Variable';
        } else if (n.class === 'Method') {
            return 'Method';
        }
        return '';
    }

    addError(parent: string, error: any) {

    }

    devicesValue(): Array<Device> {
        return Object.values(this.data.devices);
    }

    queryNext(node: Node) {
        let n = (node) ? { id: node.id } : null;
        if (this.isBACnet() && node) {
            n['parent'] = (node.parent) ? node.parent.id : null;
        }
        this.hmiService.askDeviceBrowse(this.data.device.id, n);
    }

    attributeToString(attribute) {
        let result = '';
        if (attribute) {
            Object.values(attribute).forEach((x) => {
                if (result.length) {
                    result += ', ';
                }
                result += x;
            });
        }
        return result;
    }

    isSiemensS7() {
		return (this.data.device.type === DeviceType.SiemensS7) ? true : false;
	}

	isModbus() {
		return (this.data.device.type === DeviceType.ModbusRTU || this.data.device.type === DeviceType.ModbusTCP) ? true : false;
    }

    isOpcua() {
		return (this.data.device.type === DeviceType.OPCUA) ? true : false;
    }

    isWebApi() {
		return (this.data.device.type === DeviceType.WebAPI) ? true : false;
    }

    isBACnet() {
        return (this.data.device.type === DeviceType.BACnet) ? true : false;
    }

    isInternal() {
		return (this.data.device.type === DeviceType.internal) ? true : false;
    }

    isEthernetIp() {
		return (this.data.device.type === DeviceType.EthernetIP) ? true : false;
    }

    isServer() {
		return (this.data.device.type === DeviceType.FuxaServer) ? true : false;
    }

    checkMemAddress(memaddress) {
        if (memaddress === '000000' || memaddress === '100000') {
            this.data.tag.type = ModbusTagType.Bool;
        }
    }

    isValidate() {
        if (this.error) {
            return false;
        } else if (this.isOpcua() || this.isWebApi()) {
            return true;
        } else if (this.isInternal()) {
            return (this.data.tag.name) ? true : false;
        } else if (this.data.tag && !this.data.tag.name) {
            return false;
        } else if (this.isModbus() && (!this.data.tag.address || parseInt(this.data.tag.address) <= 0)) {
            return false;
        }
        return true;
    }
}

export enum EditTagDialogType {
    Standard = 'standard',  // without browser
    Simple = 'simple',        // name and path
    Tree = 'tree'
}
