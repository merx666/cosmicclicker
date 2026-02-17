import { M as createVNode, P as defineComponent, T as createBlock, bt as withCtx, et as openBlock, ot as resolveComponent } from "./vue.runtime.esm-bundler-XtMkEjzB.js";
import "./_MapCache-2DOjsNfr.js";
import "./src-BXCRdH3z.js";
import "./sanitize-html-DjneYy0u.js";
import "./users.store-DcSwoSKe.js";
import "./MainSidebarHeader-BqiTq8-G.js";
import { t as BaseLayout_default } from "./BaseLayout-DRnUeQfL.js";
import "./constants-BjG5rZEQ.js";
import "./merge-CxybmfZy.js";
import "./_baseOrderBy-CK_-ByWC.js";
import "./dateformat-Bc6vycUF.js";
import "./useDebounce-Do4ysoi8.js";
import "./versions.store-C86IUxqb.js";
import "./usePageRedirectionHelper-BFiPLkA1.js";
import "./useBugReporting-DkunMlk0.js";
import "./canvas.utils-CqeUMKo3.js";
import "./folders.store-vL9IaYeD.js";
import "./KeyboardShortcutTooltip-BC_DWZpt.js";
import "./sourceControl.eventBus-DNWdGdf8.js";
import "./useKeybindings-C7TED23l.js";
import "./useGlobalEntityCreation-D4WJMPg3.js";
import "./useSettingsItems-CPHv_cMa.js";
import { t as AppSidebar_default } from "./AppSidebar-Cu6aYtb_.js";
import "./readyToRun.store-C4tWt6fs.js";
import "./resourceCenter.store-D1CgDOsj.js";
var DefaultLayout_default = /* @__PURE__ */ defineComponent({
	__name: "DefaultLayout",
	setup(__props) {
		return (_ctx, _cache) => {
			const _component_RouterView = resolveComponent("RouterView");
			return openBlock(), createBlock(BaseLayout_default, null, {
				sidebar: withCtx(() => [createVNode(AppSidebar_default)]),
				default: withCtx(() => [createVNode(_component_RouterView)]),
				_: 1
			});
		};
	}
});
export { DefaultLayout_default as default };
