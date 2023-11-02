# Navigate Neos CMS document tree with configurable tabs

This plugin adds tabs above the document tree in Neos CMS.
Each tab can show a different subtree of the main page tree.

⚠️ this plugin is currently only a preview for testing its viability and shouldn't be used in production yet.

## Installation

```console
composer require shel/neos-subtrees
```

## Example configuration

```yaml
Neos:
  Neos:
    Ui:
      frontendConfiguration:
        'Shel.Neos.SubTrees:TabbedPageTree':
          presets:
            default:
              title: Default
              tooltip: Default document tree
              icon: home
            # Example for a custom preset:
            blog:
              # The label shown in the tab
              title: Blog
              # The tooltip to show when the tab is hovered
              tooltip: Blog & blog articles
              # The icon for the tab
              icon: list-alt
              # The path to the root node of this subtree / tab
              rootNode: '/sites/mysite/blog'
```

## Development - Build a new version

Run the following commands in the `ui-plugin` folder to build a new version of the plugin:

```console
yarn
yarn build
```
