<script setup>
import {ref, defineEmits, watch} from "vue";

const props = defineProps({
    label: {
        type: String,
        required: true
    },
    modelValue: {
        type: String,
        required: true
    },
    placeholder: {
        type: String,
        default: ''
    }
})

const emits = defineEmits(['update:modelValue'])

const inputValue = ref(props.modelValue)
watch(() => props.modelValue, (newValue) => {
    inputValue.value = newValue
})

const onInput = (e) => {
    inputValue.value = e.target.value
    emits('update:modelValue', e.target.value)
}

</script>

<template>
    <div class="wrap">
        <div class="label">{{props.label}}</div>
        <input class="value" v-model="inputValue" :placeholder="props.placeholder" @input="onInput"/>
    </div>
</template>

<style scoped>
.wrap {
    display: inline-flex;
    width: 100%;
    font-size: 12px;
    .label {
        width: 100px;
        text-align: right;
        padding-right: 10px;
        color: #666666;
    }
    .value {
        flex: 1;
        color: #212121;
    }
    .value::placeholder {
        color: #C4C4C4;
    }
}
</style>