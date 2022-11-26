import 'element-plus/es/components/message/style/css'
import { ElMessageBox } from 'element-plus'

const msg_request_length = 128;
const msg_request_report_id = 3;
const msg_response_report_id = 3;
const msg_response_length = 128;

export class Device{
    connected = false
    hid_divece: HIDDevice|undefined = undefined
    on_connected = async ()=>{
        console.log(await this.send_request(0, "hello", 3000))
    }
    on_disconnected = ()=>{}
    on_device_output = ()=>{}
    session_listeners: Map<number,(resp:string|object)=>void> = new Map()

    async connect(vid:number, pid: number){
        let devices = await navigator.hid.requestDevice({filters:[{
            vendorId: vid,
            productId: pid,
            usagePage: 0xff01,
            usage: 0x01
        }]})
        console.log(devices)
        if(devices.length == 0){
            ElMessageBox.alert('未选择任何有效设备', '连接失败')
            return false
        }else if(devices.length > 1){
            ElMessageBox.alert('只能选择一个设备', '连接失败')
            return false
        }

        let device = devices[0]
        await device.open()
        if(!device.opened){
            ElMessageBox.alert('无法打开设备', '连接失败')
            return false
        }

        this.hid_divece = device
        this.connected = true
        navigator.hid.addEventListener("disconnect", (evt) =>{
            if(evt.device == device){
                this.connected = false
                this.on_disconnected()
                ElMessageBox.alert('连接已断开', '连接断开')
            }
        })
        this.hid_divece.oninputreport= (ev)=>{
            if(ev.reportId == msg_response_report_id){
                let buff = ev.data
                let session = buff.getUint16(0, true)   // session
                let length = buff.getUint16(2, true)   // length
                
                if(this.session_listeners.has(session)){
                    let s = new TextDecoder().decode(new DataView(buff.buffer, 4 + buff.byteOffset, length))
                    console.log('recv: ' + s)
                    let data = s.startsWith('{') ? JSON.parse(s): s
                    this.session_listeners.get(session)!(data)
                }
            }
        }
        this.on_connected()
        return true
    }

    async send_request(opcode: number, data: string|object, timeout=0){
        let buff = new ArrayBuffer(128)
        let view = new DataView(buff)
        let session = 0
        view.setUint16(0, opcode, true);    // opcode
        view.setUint16(2, session, true);         // session
        let dataview = new Uint8Array(buff, 6, msg_request_length - 6); // data
        let s = typeof(data) == 'string' ? data : JSON.stringify(data)
        console.log('sending: '+ s)
        let rst = new TextEncoder().encodeInto(s, dataview)
        if(rst.read != s.length || rst.written == undefined){
            ElMessageBox.alert('消息长度超出编码限制', '发送失败')
            return
        }
        view.setUint16(4, rst.written, true)    // length
        let p = new Promise((resolve, reject) =>{
            let resolved = false
            this.session_listeners.set(session, (resp)=>{
                resolved = true
                resolve(resp)
            })
            if(timeout != 0){
                setTimeout(()=>{
                    if(!resolved){
                        reject('请求超时')
                    }
                }, timeout)
            }
        }) as Promise<string | object>
        await this.hid_divece?.sendReport(msg_request_report_id, buff)
        return await p
    }

    
}

