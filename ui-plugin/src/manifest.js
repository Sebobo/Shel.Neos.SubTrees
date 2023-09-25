import manifest from '@neos-project/neos-ui-extensibility';
import makeTabbedPageTreeContainer from './makeTabbedPageTreeContainer';

import './pageTree.css';

manifest('Shel.Neos.SubTrees:TabbedPageTree', {}, (globalRegistry) => {
    const containerRegistry = globalRegistry.get('containers');
    const PageTreeToolbar = containerRegistry.get('LeftSideBar/Top/PageTreeToolbar');
    const PageTreeSearchbar = containerRegistry.get('LeftSideBar/Top/PageTreeSearchbar');
    const PageTree = containerRegistry.get('LeftSideBar/Top/PageTree');

    containerRegistry.set('LeftSideBar/Top/PageTreeToolbar', () => null);
    containerRegistry.set('LeftSideBar/Top/PageTreeSearchbar', () => null);
    containerRegistry.set(
        'LeftSideBar/Top/PageTree',
        makeTabbedPageTreeContainer(PageTreeToolbar, PageTreeSearchbar, PageTree)
    );
});
