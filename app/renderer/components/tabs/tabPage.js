/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const React = require('react')
const Immutable = require('immutable')

// Components
const ReduxComponent = require('../reduxComponent')

// Actions
const appActions = require('../../../../js/actions/appActions')
const windowActions = require('../../../../js/actions/windowActions')

// Constants
const dragTypes = require('../../../../js/constants/dragTypes')
const settings = require('../../../../js/constants/settings')

// Utils
const {getSetting} = require('../../../../js/settings')
const {getCurrentWindowId} = require('../../currentWindow')
const dndData = require('../../../../js/dndData')
const frameStateUtil = require('../../../../js/state/frameStateUtil')
const dnd = require('../../../../js/dnd')

const {StyleSheet, css} = require('aphrodite/no-important')
const globalStyles = require('../styles/global')
const {theme} = require('../styles/theme')

class TabPage extends React.Component {
  constructor (props) {
    super(props)
    this.onMouseEnter = this.onMouseEnter.bind(this)
    this.onMouseLeave = this.onMouseLeave.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onClick = this.onClick.bind(this)
  }

  onMouseLeave () {
    windowActions.setTabPageHoverState(this.props.index, false)
  }

  onMouseEnter (e) {
    windowActions.setTabPageHoverState(this.props.index, true)
  }

  onDrop (e) {
    if (this.props.isPageEmpty) {
      return
    }

    appActions.dataDropped(getCurrentWindowId())

    const sourceDragData = dndData.getDragData(e.dataTransfer, dragTypes.TAB)
    const sourceDragFromPageIndex = this.props.sourceDragFromPageIndex
    // This must be executed async because the state change that this causes
    // will cause the onDragEnd to never run
    setTimeout(() => {
      // If we're moving to a right page, then we're already shifting everything to the left by one, so we want
      // to drop it on the right.
      windowActions.moveTab(sourceDragData.get('key'), this.props.moveToFrameKey,
        // Has -1 value for pinned tabs
        sourceDragFromPageIndex === -1 ||
        sourceDragFromPageIndex >= this.props.index)
      if (sourceDragData.get('pinnedLocation')) {
        appActions.tabPinned(sourceDragData.get('tabId'), false)
      }
    }, 0)
  }

  onDragOver (e) {
    e.dataTransfer.dropEffect = 'move'
    e.preventDefault()
  }

  onContextMenu (e) {
    e.stopPropagation()
    windowActions.onTabPageContextMenu(this.props.index)
  }

  onCloseTabPage () {
    return this.props.tabPageFrames
      .map(frame => appActions.tabCloseRequested(frame.get('tabId')))
  }

  onAuxClick (e) {
    this.onClick(e)
  }

  onClick (e) {
    e.stopPropagation()
    switch (e.button) {
      case 2:
        // Ignore right click
        return
      case 1:
        // Close tab page with middle click
        // and eventually cancel the hover state
        this.onCloseTabPage()
        windowActions.setTabPageHoverState(this.props.index, false)
        break
      default:
        windowActions.setTabPageIndex(this.props.index)
    }
  }

  componentDidMount () {
    this.tabPageNode.addEventListener('auxclick', this.onAuxClick.bind(this))
  }

  mergeProps (state, ownProps) {
    const currentWindow = state.get('currentWindow')
    const frames = frameStateUtil.getNonPinnedFrames(currentWindow) || Immutable.List()
    const tabsPerPage = Number(getSetting(settings.TABS_PER_PAGE))
    const index = ownProps.index
    const tabPageFrames = frames.slice(index * tabsPerPage, (index * tabsPerPage) + tabsPerPage) || Immutable.List()
    const isAudioPlaybackActive = tabPageFrames.find((frame) =>
    frame.get('audioPlaybackActive') && !frame.get('audioMuted'))

    let sourceDragFromPageIndex
    const sourceDragData = dnd.getInterBraveDragData()
    if (sourceDragData) {
      sourceDragFromPageIndex = frames.findIndex((frame) => frame.get('key') === sourceDragData.get('key'))

      if (sourceDragFromPageIndex !== -1) {
        sourceDragFromPageIndex /= tabsPerPage
      }
    }

    const props = {}
    // used in renderer
    props.index = index
    props.isAudioPlaybackActive = isAudioPlaybackActive
    props.previewTabPage = getSetting(settings.SHOW_TAB_PREVIEWS)
    props.active = currentWindow.getIn(['ui', 'tabs', 'tabPageIndex']) === props.index

    // used in other functions
    props.sourceDragFromPageIndex = sourceDragFromPageIndex
    props.tabPageFrames = tabPageFrames
    props.isPageEmpty = tabPageFrames.isEmpty()
    props.moveToFrameKey = tabPageFrames.getIn([0, 'key'])

    return props
  }

  render () {
    return <span
      ref={(node) => { this.tabPageNode = node }}
      data-tab-page={this.props.index}
      data-test-id='tabPage'
      data-test2-id={this.props.index}
      data-test-active-tabPage={this.props.active}
      onDragOver={this.onDragOver.bind(this)}
      onMouseEnter={this.props.previewTabPage ? this.onMouseEnter : null}
      onMouseLeave={this.props.previewTabPage ? this.onMouseLeave : null}
      onDrop={this.onDrop.bind(this)}
      className={css(
        styles.tabPage,
        this.props.isAudioPlaybackActive && styles.tabPage_audio,
        this.props.active && styles.tabPage_active
      )}
      onContextMenu={this.onContextMenu}
      onClick={this.onClick}
    />
  }
}

const styles = StyleSheet.create({
  tabPage: {
    backgroundColor: theme.tabPage.backgroundColor,
    boxSizing: 'border-box',
    display: 'inline-block',
    margin: 'auto 2.5px',
    height: '7px',
    width: '35px',
    WebkitAppRegion: 'no-drag',

    // Default border styles
    borderRadius: globalStyles.radius.borderRadius,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: theme.tabPage.borderColor,

    ':hover': {
      backgroundColor: theme.tabPage.hover.backgroundColor,
      borderColor: theme.tabPage.hover.borderColor
    }
  },

  tabPage_audio: {
    borderColor: theme.audio.color
  },

  tabPage_active: {
    backgroundColor: theme.tabPage.active.backgroundColor,
    borderColor: theme.tabPage.active.borderColor,

    ':hover': {
      backgroundColor: theme.tabPage.active.hover.backgroundColor,
      borderColor: theme.tabPage.active.hover.borderColor
    }
  }
})

module.exports = ReduxComponent.connect(TabPage)
