import { C as computed, E as createCommentVNode, M as createVNode, P as defineComponent, T as createBlock, bt as withCtx, et as openBlock, nt as provide, ot as resolveComponent } from "./vue.runtime.esm-bundler-XtMkEjzB.js";
import "./_MapCache-2DOjsNfr.js";
import { yi as useRoute } from "./src-BXCRdH3z.js";
import "./sanitize-html-DjneYy0u.js";
import { s as useWorkflowsStore } from "./users.store-DcSwoSKe.js";
import { t as BaseLayout_default } from "./BaseLayout-DRnUeQfL.js";
import { xc as WorkflowIdKey } from "./constants-BjG5rZEQ.js";
import "./merge-CxybmfZy.js";
import "./_baseOrderBy-CK_-ByWC.js";
import "./dateformat-Bc6vycUF.js";
import "./useDebounce-Do4ysoi8.js";
import "./useClipboard-BpA9cv0A.js";
import "./executions.store-BhxP88ZI.js";
import "./assistant.store-DvNQDmex.js";
import "./chatPanel.store-D1Bxhrom.js";
import "./RunData-DpwDjJfb.js";
import "./NDVEmptyState-BIWqDDDJ.js";
import "./useEnvFeatureFlag-C42fkRiA.js";
import "./externalSecrets.ee.store-RFkH6tk9.js";
import "./uniqBy-CqovIWk7.js";
import "./usePinnedData-DyzbUV7Q.js";
import "./nodeIcon-rhcxnRCP.js";
import "./canvas.utils-CqeUMKo3.js";
import "./nodeCreator.store-2QI7mSoL.js";
import "./useCanvasOperations-BUcSaZ_2.js";
import "./folders.store-vL9IaYeD.js";
import "./RunDataHtml-CSYDFYWy.js";
import "./NodeIcon-BD8b2bJS.js";
import "./useRunWorkflow-DBMBwPEm.js";
import "./pushConnection.store-D_xxHQ1O.js";
import "./vue-json-pretty-C8ozTv7n.js";
import "./collaboration.store-4wNF-TX7.js";
import "./dateFormatter-G64pKMi1.js";
import "./useExecutionHelpers-RGmpa2-V.js";
import "./KeyboardShortcutTooltip-BC_DWZpt.js";
import "./useKeybindings-C7TED23l.js";
import "./useLogsTreeExpand-C_T6FNMH.js";
import { t as LogsPanel_default } from "./LogsPanel-CKwmjkcY.js";
import "./AnimatedSpinner--2Ek9VrF.js";
import "./ChatFile-BrXecLHH.js";
var DemoFooter_default = /* @__PURE__ */ defineComponent({
	__name: "DemoFooter",
	setup(__props) {
		const workflowsStore = useWorkflowsStore();
		const hasExecutionData = computed(() => workflowsStore.workflowExecutionData);
		return (_ctx, _cache) => {
			return hasExecutionData.value ? (openBlock(), createBlock(LogsPanel_default, {
				key: 0,
				"is-read-only": true
			})) : createCommentVNode("", true);
		};
	}
});
var DemoLayout_default = /* @__PURE__ */ defineComponent({
	__name: "DemoLayout",
	setup(__props) {
		const route = useRoute();
		provide(WorkflowIdKey, computed(() => {
			const name = route.params.name;
			return Array.isArray(name) ? name[0] : name;
		}));
		return (_ctx, _cache) => {
			const _component_RouterView = resolveComponent("RouterView");
			return openBlock(), createBlock(BaseLayout_default, null, {
				footer: withCtx(() => [createVNode(DemoFooter_default)]),
				default: withCtx(() => [createVNode(_component_RouterView)]),
				_: 1
			});
		};
	}
});
export { DemoLayout_default as default };
