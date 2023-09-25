import React, { PureComponent } from "react";
import { Tabs, Icon } from "@neos-project/react-ui-components";
import { connect } from "react-redux";
import { actions, selectors } from "@neos-project/neos-ui-redux-store";
import { neos } from "@neos-project/neos-ui-decorators";
import backend from "@neos-project/neos-ui-backend-connector";
import "./tabs.css";

const SELECTED_TAB_STORAGE_KEY = "Shel.Neos.SubTrees:SelectedTab";

const makeTabbedPageTreeContainer = (ToolBar, SearchBar, PageTree) => {
    const ToolBarInstance = <ToolBar />;
    const SearchBarInstance = <SearchBar />;

    class TabbedPageTreeContainer extends PureComponent {
        state = {
            selectedPreset: "",
            getAvailablePresets: {},
        };

        constructor(props) {
            super(props);

            const availablePresets = this.getAvailablePresets(props);

            this.state = {
                selectedPreset:
                    localStorage.getItem(SELECTED_TAB_STORAGE_KEY) ||
                    Object.keys(props.options.presets)[0],
                availablePresets,
            };

            // Make sure active tab gets fully initialized
            const selectedPreset =
                props.options.presets[this.state.selectedPreset];
            if (selectedPreset && selectedPreset.rootNode) {
                this.focusRootNode(selectedPreset.rootNode);
            }
        }

        /**
         * Filter presets by the current site node context path
         */
        getAvailablePresets({ siteNodeContextPath, options: { presets } }) {
            const siteNodePath = siteNodeContextPath.split("@")[0];
            return Object.keys(presets).reduce((carry, presetName) => {
                const preset = presets[presetName];
                if (
                    !preset.rootNode ||
                    preset.rootNode.startsWith(siteNodePath)
                ) {
                    carry[presetName] = preset;
                }
                return carry;
            }, {});
        }

        componentDidUpdate(prevProps) {
            // If the siteNodeContextPath or baseWorkspaceName have changed, fully reset the state
            if (
                this.props.siteNodeContextPath !==
                    prevProps.siteNodeContextPath ||
                this.props.baseWorkspaceName !== prevProps.baseWorkspaceName
            ) {
                this.fullReset();
            }
        }

        fullReset = () => {
            const availablePresets = this.getAvailablePresets(this.props);
            this.setState({
                selectedPreset:
                    localStorage.getItem(SELECTED_TAB_STORAGE_KEY) ||
                    Object.keys(availablePresets)[0],
                availablePresets,
            });
        };

        onActiveTabChange = async (activeTab) => {
            this.setState({ selectedPreset: activeTab });
            localStorage.setItem(SELECTED_TAB_STORAGE_KEY, activeTab);

            if (!activeTab) {
                // Nothing to do for the default case
                return;
            }

            const preset = this.props.options.presets[activeTab];
            if (preset.rootNode) {
                this.focusRootNode(preset.rootNode);
            }
        };

        focusRootNode = async (rootNode) => {
            const rootNodeContextPath = rootNode
                ? rootNode + "@" + this.props.siteNodeContextPath.split("@")[1]
                : null;

            let rootNodeForPreset =
                this.props.getNodeByContextPath(rootNodeContextPath);

            if (rootNodeForPreset) {
                this.focusNode(rootNodeForPreset);
                return;
            }

            // Load root node for preset and all its children, then set the root node as focused
            this.props.setAsLoading(rootNodeContextPath);

            const { q } = backend.get();

            try {
                const query = q(rootNodeContextPath);
                const parentNodes = await query.getForTree();
                // const { baseNodeType } =
                //     configuration.nodeTree.presets.default;
                // FIXME: Read from config or preset?
                const baseNodeType = "Neos.Neos:Document";
                const childNodes = await query
                    .neosUiFilteredChildren(baseNodeType)
                    .getForTree();

                if (parentNodes) {
                    const nodes = parentNodes
                        .concat(childNodes)
                        .reduce((nodeMap, node) => {
                            nodeMap[node.contextPath] = node;
                            return nodeMap;
                        }, {});
                    this.props.merge(nodes);
                    rootNodeForPreset =
                        this.props.getNodeByContextPath(rootNodeContextPath);
                    this.focusNode(rootNodeForPreset);
                }
            } catch (err) {
                console.error("failed getting preset rootnode", err);
            } finally {
                this.props.setAsLoaded(rootNodeContextPath);
            }
        };

        focusNode = (node) => {
            this.props.focus(node.contextPath);
            this.props.setDocumentNode(node.contextPath);
            this.props.setActiveContentCanvasSrc(node.uri);
            if (!this.props.getToggled.includes(node.contextPath)) {
                this.props.toggle(node.contextPath);
            }
        };

        render() {
            const {
                i18nRegistry,
                siteNodeContextPath,
                getNodeByContextPath,
                getIsLoading,
            } = this.props;
            const { selectedPreset, availablePresets } = this.state;

            return (
                <div className="tabbedPageTree_pageTreeContainer">
                    <div className="tabbedPageTree_pageTreeToolbar">
                        {ToolBarInstance}
                    </div>
                    {SearchBarInstance}
                    <Tabs
                        activeTab={selectedPreset}
                        onActiveTabChange={this.onActiveTabChange}
                        theme={{
                            tabs: "tabbedPageTree_tabs",
                            tabs__content: "tabbedPageTree_tabs__content",
                            tabs__panel: "tabbedPageTree_tabs__panel",
                        }}
                    >
                        {Object.keys(availablePresets).map((presetName) => {
                            const preset = availablePresets[presetName];
                            const rootNodeContextPath = preset.rootNode
                                ? preset.rootNode +
                                  "@" +
                                  siteNodeContextPath.split("@")[1]
                                : null;
                            const treeProps = {};

                            if (preset.rootNode) {
                                treeProps.rootNode =
                                    getNodeByContextPath(rootNodeContextPath);
                            }

                            return (
                                <Tabs.Panel
                                    id={presetName}
                                    key={presetName}
                                    icon={preset.icon}
                                    title={preset.title}
                                    tooltip={i18nRegistry.translate(
                                        preset.tooltip
                                    )}
                                    theme={{
                                        panel: "tabbedPageTree_panel",
                                    }}
                                >
                                    <PageTree {...treeProps} />
                                </Tabs.Panel>
                            );
                        })}
                    </Tabs>
                    {getIsLoading && (
                        <div className="tabbedPageTree_pageTreeToolbar_loading">
                            <Icon icon="spinner" spin /> Loading documents…
                        </div>
                    )}
                </div>
            );
        }
    }

    const neosifier = neos((globalRegistry) => ({
        options: globalRegistry
            .get("frontendConfiguration")
            .get("Shel.Neos.SubTrees:TabbedPageTree"),
        i18nRegistry: globalRegistry.get("i18n"),
    }));

    const connector = connect(
        (state) => ({
            getNodeByContextPath: selectors.CR.Nodes.nodeByContextPath(state),
            getToggled: selectors.UI.PageTree.getToggled(state),
            getIsLoading: selectors.UI.PageTree.getIsLoading(state),
            siteNodeContextPath: state?.cr?.nodes?.siteNode,
            baseWorkspaceName:
                state?.cr?.workspaces?.personalWorkspace?.baseWorkspace,
        }),
        {
            toggle: actions.UI.PageTree.toggle,
            focus: actions.UI.PageTree.focus,
            setAsLoading: actions.UI.PageTree.setAsLoading,
            setAsLoaded: actions.UI.PageTree.setAsLoaded,
            setActiveContentCanvasSrc: actions.UI.ContentCanvas.setSrc,
            merge: actions.CR.Nodes.merge,
            setDocumentNode: actions.CR.Nodes.setDocumentNode,
        }
    );

    return neosifier(connector(TabbedPageTreeContainer));
};

export default makeTabbedPageTreeContainer;
