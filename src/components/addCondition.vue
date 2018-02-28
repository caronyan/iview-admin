<template>
    <div>
        <Form ref="conditionForm" :inline="true" :model="conditionForm" label-position="right" :label-width="20">
            <Row type="flex" align="middle" v-for="(domain, index) in conditionForm.conditions" :key="index + new Date().getTime()">
                <!-- 同表条件标记 -->
                <Col v-if="domain.isSub" offset="1" span="1">
                    <Icon type="arrow-right-b"></Icon>
                </Col>
                <Col span="5">
                    <FormItem>
                        <Select v-model="domain.dim" placeholder="选择维度" filterable @change="handleOptionChange(domain.dimId)">
                            <OptionGroup v-for="(group, groupIdx) in conditionGroupOptions" :label="group.label" :key="groupIdx + new Date().getTime()">
                                <!-- 使用同表条件过滤 -->
                                <Option 
                                    v-for="(option, optIdx) in getAvailableDim(group.options, domain)" 
                                    :key="optIdx + new Date().getTime()" 
                                    :value="option.value">
                                    {{ option.label }}
                                </Option>
                            </OptionGroup>
                        </Select>
                    </FormItem>
                </Col>
                <Col span="11">
                    <!-- 处理不同类型条件分支 -->
                    <!-- 日期条件 -->
                    <Row v-if="domain.type == 'date'">
                        <Col span="10">
                            <FormItem label="从">
                                <DatePicker type="date" v-model="domain.start" placeholder="很久以前" style="width: 100%"></DatePicker>
                            </FormItem>  
                        </Col> 
                        <Col span="10">
                            <FormItem label="到">
                                <DatePicker type="date" v-model="domain.end" placeholder="现在" style="width: 100%"></DatePicker>
                            </FormItem>   
                        </Col>
                    </Row>
                    <!-- 数值条件 -->
                    <Row v-if="domain.type == 'numeric'">
                        <Col span="10">
                            <FormItem label="从">
                                <InputNumber v-model="domain.start" placeholder="很小" style="width: 100%"></InputNumber>
                            </FormItem>  
                        </Col> 
                        <Col span="10">
                            <FormItem label="到">
                                <InputNumber v-model="domain.end" placeholder="很大" style="width: 100%"></InputNumber>
                            </FormItem>   
                        </Col>
                    </Row>
                    <!-- 枚举条件 覆盖多选/布尔 -->
                    <Row v-if="domain.type == 'enum'">
                        <Col span="10">
                            <Switch v-model="domain.is">
                                <span slot="open">开</span>
                                <span slot="close">关</span>
                            </Switch>
                        </Col> 
                        <Col span="10">
                            <!-- 根据枚举内容切换展示形态 -->
                            <FormItem v-if="enmuItemDisplayType(domain) === 'select'">
                                <Select v-model="domain.item" placeholder="某个项" filterable multiple >
                                    <Option 
                                        v-for="(item, itemIdx) in getEnumItems(domain.dim)" 
                                        :key="itemIdx + new Date().getTime()" 
                                        :value="item.value">
                                        {{ item.label }}
                                    </Option>
                                </Select>
                            </FormItem>   
                            <FormItem v-else-if="enmuItemDisplayType(domain) === 'panel'">
                                <!-- TODO: 城市选择框-->
                            </FormItem> 
                        </Col>
                    </Row>
                    <!-- 日志条件 覆盖页面日志和动作日志 -->
                    <Row v-if="domain.type == 'log'">
                        <Col span="6">
                            <FormItem>
                                <Select v-model="domain.item" :placeholder="getLogSelectPlaceholder(domain)" filterable >
                                    <Option 
                                        v-for="(item, itemIdx) in getEnumItems(domain.dim)" 
                                        :key="itemIdx + new Date().getTime()" 
                                        :value="item.value">
                                        {{ item.label }}
                                    </Option>
                                </Select>
                            </FormItem>   
                        </Col> 
                        <Col span="4">
                            <FormItem>
                                <Input type="number" placeholder="数值下限" v-model="domain.logLow" style="width: 100%"></Input>
                            </FormItem>   
                        </Col>
                        <Col span="4">
                            <FormItem>
                                <Input type="number" placeholder="数值上限" v-model="domain.logHigh" style="width: 100%"></Input>
                            </FormItem>   
                        </Col>
                        <Col span="5">
                            <FormItem>
                                <DatePicker type="date" v-model="domain.start" placeholder="开始时间" style="width: 100%"></DatePicker>
                            </FormItem>   
                        </Col>
                        <Col span="5">
                            <FormItem>
                                <DatePicker type="date" v-model="domain.end" placeholder="结束时间" style="width: 100%"></DatePicker>
                            </FormItem>   
                        </Col>
                    </Row>
                    <!-- 复合条件 用于聚合类条件 -->
                    <Row v-if="domain.type == 'complex'">
                        <Col span="4">
                            <FormItem>
                                <DatePicker type="date" v-model="domain.rangeStat.range.start" placeholder="开始时间" style="width: 100%"></DatePicker>
                            </FormItem>   
                        </Col> 
                        <Col span="4">
                            <FormItem>
                                <DatePicker type="date" v-model="domain.rangeStat.range.end" placeholder="结束时间" style="width: 100%"></DatePicker>
                            </FormItem>   
                        </Col> 
                        <Col span="4" v-if="showCompareDatePair(domain.rangeStat.rangeType)">
                            <FormItem>
                                <DatePicker type="date" v-model="domain.rangeStat.compareRange.start" placeholder="对比起始" style="width: 100%"></DatePicker>
                            </FormItem>   
                        </Col> 
                        <Col span="4" v-if="showCompareDatePair(domain.rangeStat.rangeType)">
                            <FormItem>
                                <DatePicker type="date" v-model="domain.rangeStat.compareRange.end" placeholder="对比结束" style="width: 100%"></DatePicker>
                            </FormItem>   
                        </Col> 
                        <Col span="4">
                            <FormItem>
                                <Select v-model="domain.rangeStat.rangeType" filterable placeholder="聚合类型">
                                    <Option value="count">天数</Option>
                                    <Option value="sum">单量</Option>
                                    <Option value="compare">同比</Option>
                                    <Option value="compareCnt">天数同比</Option>
                                </Select>
                            </FormItem>  
                        </Col>
                        <Col span="2">
                            <FormItem>
                                <Input type="number" placeholder="下限" v-model="domain.rangeStat.customRange.start" style="width: 100%"></Input>
                            </FormItem>   
                        </Col>
                        <Col span="2">
                            <FormItem>
                                <Input type="number" placeholder="上限" v-model="domain.rangeStat.customRange.end" style="width: 100%"></Input>
                            </FormItem>   
                        </Col>
                    </Row>
                </Col>
                <Col span="1">
                    <Icon type="close-round"></Icon>
                </Col>
                <!-- 子条件和复合条件不支持添加自条件 -->
                <Col v-if="!domain.isSub && domain.type != 'complex'" span="1">
                    <Icon type="chevron-down" @click.prevent="addDomain(true, domain.dim)"></Icon>
                </Col>
                <!-- 子条件通过父条件添加并列条件 -->
                <Col v-if="!domain.isSub" span="1">
                    <Icon type="plus-round"></Icon>
                </Col>
            </Row>
        </Form>
    </div>
</template>
<script>
    export default {
        props: {
            conditionGroupOptions: {
                type: Array,
                // default: () => [],
                default: () => [{
                    label: '第一个分组',
                    options: [{
                        label: '城市',
                        value: 'city',
                    }],
                }],
            },
        },
        data () {
            return {
                conditionForm: {
                    conditions: [{
                        // object template
                        'dim': '',
                        'dimLabel': '',
                        'start': '',
                        'end': '',
                        'item': [],
                        'field': '',
                        'type': 'date', // date/numeric/enum/log/complex
                        'is': true,
                        'table': '',
                        'isSub': false,
                        'parentDim': 0,
                        'logLow': '',
                        'logHigh': '',
                        'offsetStart': '',
                        'offsetEnd': '',
                        'startType': 'current',
                        'rangeStat': {
                            'range': {
                                'start': '',
                                'end': '',
                            },
                            'rangeType': 'count', // count/sum/compare
                            'customRange': {
                                'start': '',
                                'end': '',
                            },
                            'compareRange': {
                                'start': '',
                                'end': '',
                            },
                        },
                        'dimId': 'dim_' + new Date().getTime(),
                    }],
                },
            };
        },
        methods: {
            addDomain (domain) {
                if (domain.isSub) {
                    this.conditionForm.conditions.splice(
                        this.conditionForm.conditions.indexOf(this.conditionForm.conditions.find(x => x.dim === domain.parentDim)) + 1,
                        0,
                        {
                            'dim': '',
                            'dimLabel': '',
                            'field': '',
                            'start': '',
                            'end': '',
                            'item': [],
                            'type': 'date',
                            'is': true,
                            'table': '',
                            'isSub': domain.isSub,
                            'parentDim': domain.parentDim,
                            'logLow': '',
                            'logHigh': '',
                            'offsetStart': '',
                            'offsetEnd': '',
                            'startType': 'current',
                            'rangeStat': {
                                'range': {
                                    'start': '',
                                    'end': '',
                                },
                                'rangeType': 'count',
                                'customRange': {
                                    'start': '',
                                    'end': '',
                                },
                                'compareRange': {
                                    'start': '',
                                    'end': '',
                                },
                            },
                            'dimId': 'dim_' + new Date().getTime(),
                        }
                    );
                } else {
                    this.conditionForm.conditions.push({
                        'dim': '',
                        'dimLabel': '',
                        'field': '',
                        'start': '',
                        'end': '',
                        'item': [],
                        'type': 'date',
                        'is': true,
                        'table': '',
                        'isSub': domain.isSub,
                        'parentDim': domain.parentDim,
                        'logLow': '',
                        'logHigh': '',
                        'offsetStart': '',
                        'offsetEnd': '',
                        'startType': 'current',
                        'rangeStat': {
                            'range': {
                                'start': '',
                                'end': '',
                            },
                            'rangeType': 'count', 
                            'customRange': {
                                'start': '',
                                'end': '',
                            },
                            'compareRange': {
                                'start': '',
                                'end': '',
                            },
                        },
                        'dimId': 'dim_' + new Date().getTime(),
                    });
                }
            },
            getAvailableDim (options, domain) {
                if (domain.isSub) {
                    return [];
                } else {
                    return options;
                }
            },
            getEnumItems (dim) {
                return [{
                    label: '城市',
                    value: 'shanghai',
                }];
            },
            handleOptionChange () {

            },
            // 切换枚举项的显示方式
            enmuItemDisplayType (domain) {
                return 'select';
            },
            getLogSelectPlaceholder (domain) {
                return domain.field === 'es_action_log' ? '某个行为' : '某个页面';
            },
            showCompareDatePair (aggrType) {
                return (aggrType === 'compare' || aggrType === 'compareCnt');
            },
        },
    };
</script>
<style scoped>
    .ivu-form-item {
        margin-bottom: 0;
    }
    .ivu-form-inline .ivu-form-item {
        margin-right: 0 !important;
    }
</style>