/* eslint-disable no-extra-boolean-cast */
import * as utils from '../../utils/index';
import * as AppConst from '../../constants/appConst';
import AccInfoUtil from '../../utils/accInfoUtils';
import accMeta from './account';
import userGroupMeta from './userGroup';

// 生成接口请求方法
const _generateApiFunction = meta => {
    // 返回一个接受commit和载荷的函数
    return ({ commit }, params) => {
        let isHttpGet = meta.httpMethod === AppConst.HTTP.GET;
        let isHttpPost = meta.httpMethod === AppConst.HTTP.POST;
        let fetchParams = {
            method: meta.httpMethod,
            body: (!!params && isHttpPost) ? utils.getPostParams(params) : '',
            headers: AccInfoUtil.getAuthHeader(meta.httpMethod),
        };
        // 如果是get方法移除body参数，并添加query string参数
        if (isHttpGet) {
            delete fetchParams.body;
            meta.url += utils.getUrlParams(params);
        }
        return utils.fetchWithTimeout(meta.url, fetchParams);
    };
};

// 动态生成接口方法集合
export default (() => {
    let actSet = {};
    let metas = {
        ...accMeta,
        ...userGroupMeta,
    };
    for (let meta in metas) {
        if (metas.hasOwnProperty(meta)) {
            actSet[meta] = _generateApiFunction(metas[meta]);
        }
    }
    return actSet;
})();
