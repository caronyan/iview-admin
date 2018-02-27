import Cookies from 'js-cookie';
import * as AppConst from '../../constants/appConst';

const user = {
    state: {},
    mutations: {
        logout (state, vm) {
            Cookies.remove(AppConst.ACCOUNT_ID);
            Cookies.remove(AppConst.ACCOUNT_MAIL);
            Cookies.remove(AppConst.ACCOUNT_NAME);
            Cookies.remove(AppConst.ACCOUNT_PHONE);
            Cookies.remove(AppConst.ACCOUNT_ROLE);
            Cookies.remove(AppConst.ROUTE_PERMISSION);
            // 恢复默认样式
            let themeLink = document.querySelector('link[name="theme"]');
            themeLink.setAttribute('href', '');
            // 清空打开的页面等数据，但是保存主题数据
            let theme = '';
            if (localStorage.theme) {
                theme = localStorage.theme;
            }
            localStorage.clear();
            if (theme) {
                localStorage.theme = theme;
            }
        },
    },
};

export default user;
