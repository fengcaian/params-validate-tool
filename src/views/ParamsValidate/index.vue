<script setup>
import forge from 'node-forge'
import {ref, reactive, onBeforeMount, watchEffect} from 'vue'
import { Base64 } from 'js-base64'
import * as utils from '@/utils/util'
import * as config from './config.js'
import InputField from '@/components/InputField.vue'

const formData = reactive({
    url: '',
    appsecrect: '',
    dbid: '',
    appid: '',
    loginthen: '',
    permitcount: '',
    formargs: '',
    lcid: '',
    origintype: '',
    signeddata: '',
    timestamp: '',
    username: '',
    entryrole: '',
    formid: '',
    formtype: '',
    otherargs: '',
    pkid: '',
    openmode: '',
    loginAgain: '',
});

const fields = ref([])
onBeforeMount(() => {
    const keys = Object.keys(formData)
    keys.forEach((key) => {
        if (!['url', 'appsecrect'].includes(key)) {
            fields.value.push({
                label: key === 'dbid' ? '数据中心ID' : key,
                field: key,
                placeholder: config.fieldTooltipMap[key] || key,
            })
        }
    })
})
const encode = ref('base64')
const codeType = ref('utf8')
const errorUrlTip = ref(false)
let parsedParamsFromUrl = reactive({})
const onParseUrl = () => {
    if (!formData.url) {
        return
    }
    if (!isValidUrl(formData.url)) {
        errorUrlTip.value = true
        return
    }
    errorUrlTip.value = false
    const urlParams = getParamsFromUrl(formData.url)
    let ud = urlParams?.ud
    try {
        if (ud) {
            ud = decodeURI(ud)
            let decodeParams = ''
            if (encode.value === 'base64') {
                decodeParams = Base64.decode(ud)
                decodeParams = JSON.parse(decodeParams)
                if (codeType.value === 'gbk') {
                    decodeParams = JSON.parse(utils.gbkStrToUtf16Str(utils.decodeBase64(ud)))
                }
            } else {
                decodeParams = JSON.parse(ud)
            }

            parsedParamsFromUrl = decodeParams
            const keys = Object.keys(formData)
            keys.forEach((key) => {
                if (!['url', 'appsecrect'].includes(key)) {
                    formData[key] = decodeParams[key] || ''
                }
            })
            if (decodeParams?.otherargs.match(new RegExp(/permitcount':\s?'1/))) {
                formData.permitcount = '1'
            } else if (decodeParams?.otherargs.match(new RegExp(/permitcount':\s?'0/))) {
                formData.permitcount = '0'
            }
            console.log(decodeParams)
        }
    } catch (e) {
        alert('URL有误，解析失败')
        console.log(e)
    }
}
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}
const disabledButton = ref(false)
watchEffect(() => {
    const { appsecrect, appid, dbid, timestamp, username } = formData
    disabledButton.value = !dbid || !username || !appid || !appsecrect || !timestamp
})
const getParamsFromUrl = (url) => {
    const search = url.split('?')[1]
    const params = {}
    if (search) {
        search.split('&').reduce((params, param) => {
            const [key, value] = param.split('=')
            params[key] = decodeURIComponent(value.replace(/\+/g, ' '))
            return params
        }, params)
    }
    return params
}

const INIT_RESULT = {
    waitSign: [],
    sortSign: [],
    sortSignStr: '',
    sign: '',
    ud: '',
    udBase64: '',
    url: '',
}
const stepResult = reactive({...INIT_RESULT})
const onGenerateUrl = () => {
    if (disabledButton.value) {
        return
    }
    const { appsecrect, appid, dbid, lcid, origintype, timestamp, username, entryrole, formid, formtype, otherargs, pkid, permitcount, loginAgain } = formData
    stepResult.waitSign = [dbid, username, appid, appsecrect, timestamp, loginAgain]
    const permitcountStr = `${permitcount}`
    if (permitcountStr === '0' || permitcountStr === '1') {
        stepResult.waitSign.push(formData.permitcount)
    }
    stepResult.sortSign = [...stepResult.waitSign].sort()
    stepResult.sortSignStr = stepResult.sortSign.join('')
    stepResult.sign = sha256(stepResult.sortSignStr)
    const arg = {
        appid,
        dbid,
        lcid,
        origintype,
        signeddata: stepResult.sign,
        timestamp,
        username,
        entryrole,
        formid,
        formtype,
        otherargs,
        pkid,
        loginAgain,
    }
    stepResult.ud = JSON.stringify(arg)
    stepResult.udBase64 = Base64.encode(stepResult.ud)
    const url = formData.url.split('ud=')[0]
    stepResult.url = url + 'ud=' + Base64.encode(stepResult.ud) + '&udencoding=utf-8'

    if (parsedParamsFromUrl.signeddata === stepResult.sign) {
        alert('生成的签名与输入url中参数解析出来的签名一致！')
    } else {
        alert('生成的签名与输入url中参数解析出来的签名不一致！')
    }
}

const sha256 = (data) => {
    const md = forge.md.sha256.create()
    md.update(data, 'utf8')
    return md.digest().toHex()
}
const onCancel = () => {
    let keys = Object.keys(formData)
    keys.forEach((key) => {
        if (!['url', 'appsecrect'].includes(key)) {
            formData[key] = ''
        }
    })
    keys = Object.keys(stepResult)
    keys.forEach((key) => {
        stepResult[key] = INIT_RESULT[key]
    })
}

</script>

<template>
    <div class="banner">
        <img class="logo" src="@/assets/logo.svg"/>
        <i class="divider"></i>
        <div class="banner-title">第三方系统授权登录参数检测工具</div>
    </div>
    <div class="panel-wrap">
        <div class="panel">
            <h3>第三方系统授权登录参数检测</h3>
            <div class="tips">
                <ul>
                    <li>
                        <i></i>
                        本工具是离线工具，不涉及收集敏感信息的情况。
                    </li>
                    <li>下面的解析URL，只是针对URL base64的明文解析，密钥、签名不解析；</li>
                    <li>
                        解析后的参数会自动填到文本框，方便您对比参数，也可以按自己实际调整参数，重新生成URL，具体参数说明，请参考
                        <a target="_blank" href="https://vip.kingdee.com/article/597092982771949312?productLineId=1&isKnowledge=2&lang=zh-CN">《第三方系统授权登录指南V4》</a>
                    </li>
                </ul>
            </div>
            <div class="form-content">
                <div class="form-item flex3">
                    <input-field v-model="formData.url" label="URL"></input-field>
                    <div class="error" v-if="errorUrlTip">请输入合法的url！</div>
                </div>
                <div class="form-item">
                    <input-field v-model="formData.appsecrect" label="appsecrect" placeholder="请手工录入"></input-field>
                </div>
            </div>
            <div class="button-wrap">
                <select name="encode" v-model="encode" @change="onCancel">
                    <option key="0" value="base64">base64</option>
                    <option key="1" value=""></option>
                </select>
                <select name="codeType" v-model="codeType" @change="onCancel">
                    <option key="utf8" value="utf8">UTF-8</option>
                    <option key="gbk" value="gbk">GB2312</option>
                </select>
                <div class="button" :class="[!formData.url ? 'disabled' : '']" @click="onParseUrl">解析URL</div>
            </div>
            <h3>参数设置</h3>
            <div class="form-content">
                <div class="form-item" v-for="(field, index) in fields" :key="index">
                    <input-field v-model="formData[field.field]" :label="field.label" :placeholder="field.placeholder"></input-field>
                </div>
            </div>
            <div class="button-wrap">
                <div class="button" :class="[disabledButton ? 'disabled' : '']" @click="onGenerateUrl">生成URL</div>
                <div class="button" @click="onCancel">取消</div>
            </div>
        </div>
        <div class="panel">
            <h3>URL生成步骤及结果</h3>
            <div v-if="stepResult.ud">
                <div class="tips">
                    <ul>
                        <li>
                            <i></i>
                            请根据下面每一步信息与自己集成代码对比检测参数解析信息，若发现不匹配，请调整自己代码各步骤的参数或方法
                        </li>
                    </ul>
                </div>
                <div class="result-content">
                    <div>1.待签名字段:</div>
                    <div class="result">{{ stepResult.waitSign }}</div>
                    <div>2.待签名字段排序结果:</div>
                    <div class="result">{{ stepResult.sortSign }} (说明:排序算法为按照Unicode进行排查即:数字>大写字母>小写字母>汉字)</div>
                    <div>3.待签名字段字符串拼接值:</div>
                    <div class="result">{{ stepResult.sortSignStr }}</div>
                    <div>4.SHA256签名:</div>
                    <div class="result">{{stepResult.sign}}</div>
                    <div>5.ud参数值:</div>
                    <div class="result">{{stepResult.ud}}</div>
                    <div>6.Base64加密:</div>
                    <div class="result">{{stepResult.udBase64}}</div>
                    <div>7.生成URL:</div>
                    <div class="result">{{stepResult.url}}</div>
                </div>
            </div>
            <div v-else class="no-result">
                暂未生成任何结果
            </div>
        </div>
    </div>
</template>

<style scoped>
.banner {
    width: 100%;
    height: 44px;
    display: flex;
    align-items: center;
    background: #276FF5;
    .logo {
        width: 132px;
        height: 32px;
        margin-left: 10px;
    }
    .divider {
        width: 1px;
        height: 12px;
        margin: 0 10px;
        background: #FFFFFF;
    }
    .banner-title {
        font-size: 14px;
        color: #FFFFFF;
    }
}
.panel-wrap {
    width: 100%;
    height: 100%;
    padding: 10px;
    background: #EAEAEA;
    .panel {
        min-height: 360px;
        margin-bottom: 10px;
        padding: 10px 20px;
        background: #FFFFFF;
        border-radius: 2px;
        .tips {
            background: #FFFBF2;
            border: 1px solid rgba(255,241,212,1);
            border-radius: 4px;
            ul {
                padding: 16px 32px;
            }
            ul li {
                position: relative;
                list-style-type: none;
                font-size: 12px;
                color: #212121;
                a {
                    color: #2A71F5;;
                }
                i {
                    position: absolute;
                    left: -20px;
                    top: 2px;
                    width: 16px;
                    height: 16px;
                    background: url("@/assets/warning.svg") no-repeat;
                    background-size: 16px 16px;
                }
            }
        }
        .button-wrap {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            .button {
                width: 64px;
                height: 24px;
                line-height: 24px;
                text-align: center;
                font-size: 12px;
                color: #FFFFFF;
                background: #5582F3;
                border-radius: 2px;
                cursor: pointer;
                user-select: none;
            }
            .disabled {
                background: #C4C4C4;
            }
        }
        .form-content {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            margin-top: 12px;
            .form-item {
                width: 25%;
                height: 42px;
            }
            .flex3 {
                width: 75%;
            }
        }
        .result-content {
            width: 100%;
            margin-top: 12px;
            font-size: 12px;
            background: #F7FBFF;
            border-radius: 4px;
            .result {
                color: #2A71F5;
                word-break: break-all;
            }
        }
        .error {
            font-size: 12px;
            margin-left: 100px;
            color: red;
        }
        .no-result {
            height: 240px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 16px;
            color: #212121;
        }
    }
    h3 {
        margin-bottom: 16px;
        color: #212121;
    }
}
</style>