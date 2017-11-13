/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const electron = require('electron')
const ipc = electron.ipcMain

// Constants
const appConfig = require('../../../js/constants/appConfig')
const messages = require('../../../js/constants/messages')
const settings = require('../../../js/constants/settings')

// State
const ledgerState = require('../../common/state/ledgerState')
const migrationState = require('../../common/state/migrationState')

// Actions
const appActions = require('../../../js/actions/appActions')

// Utils
const locale = require('../../locale')
const getSetting = require('../../../js/settings').getSetting

const miliseconds = {
  year: 365 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000
}

const text = {
  hello: locale.translation('updateHello'),
  paymentDone: undefined,
  addFunds: locale.translation('addFundsNotification'),
  tryPayments: locale.translation('notificationTryPayments'),
  reconciliation: locale.translation('reconciliationNotification'),
  walletConvertedToBat: locale.translation('walletConvertedToBat')
}

const pollingInterval = 15 * miliseconds.minute // 15 * minutes
let intervalTimeout
const displayOptions = {
  style: 'greetingStyle',
  persist: false
}
const nextAddFundsTime = 3 * miliseconds.day

const sufficientBalanceToReconcile = (state) => {
  const balance = Number(ledgerState.getInfoProp(state, 'balance') || 0)
  const unconfirmed = Number(ledgerState.getInfoProp(state, 'unconfirmed') || 0)
  const bat = ledgerState.getInfoProp(state, 'bat')
  return bat && (balance + unconfirmed > 0.9 * Number(bat))
}
const hasFunds = (state) => {
  const balance = getSetting(settings.PAYMENTS_ENABLED)
    ? Number(ledgerState.getInfoProp(state, 'balance') || 0)
    : 0
  return balance > 0
}
const shouldShowNotificationReviewPublishers = () => {
  const nextTime = getSetting(settings.PAYMENTS_NOTIFICATION_RECONCILE_SOON_TIMESTAMP)
  return !nextTime || (new Date().getTime() > nextTime)
}
const shouldShowNotificationAddFunds = () => {
  const nextTime = getSetting(settings.PAYMENTS_NOTIFICATION_ADD_FUNDS_TIMESTAMP)
  return !nextTime || (new Date().getTime() > nextTime)
}

const init = (state) => {
  // Check if relevant browser notifications should be shown every 15 minutes
  if (intervalTimeout) {
    clearInterval(intervalTimeout)
  }
  intervalTimeout = setInterval((state) => {
    module.exports.onInterval(state)
  }, pollingInterval, state)
}

const onLaunch = (state) => {
  const enabled = getSetting(settings.PAYMENTS_ENABLED)
  if (!enabled) {
    return state
  }

  const ledger = require('./ledger')
  state = ledger.checkBtcBatMigrated(state, enabled)

  if (hasFunds(state)) {
    // Don't bother processing the rest, which are only
    if (!getSetting(settings.PAYMENTS_NOTIFICATIONS)) {
      return state
    }

    // Show one-time BAT conversion message:
    // - if payments are enabled
    // - user has a positive balance
    // - this is an existing profile (new profiles will have firstRunTimestamp matching batMercuryTimestamp)
    // - wallet has been transitioned
    // - notification has not already been shown yet
    // (see https://github.com/brave/browser-laptop/issues/11021)
    const isNewInstall = migrationState.isNewInstall(state)
    const hasUpgradedWallet = migrationState.hasUpgradedWallet(state)
    const hasBeenNotified = migrationState.hasBeenNotified(state)
    if (!isNewInstall && hasUpgradedWallet && !hasBeenNotified) {
      module.exports.showBraveWalletUpdated()
    }
  }

  return state
}

const onInterval = (state) => {
  if (getSetting(settings.PAYMENTS_ENABLED)) {
    if (getSetting(settings.PAYMENTS_NOTIFICATIONS)) {
      showEnabledNotifications(state)
    }
  } else {
    showDisabledNotifications(state)
  }
}

const onResponse = (message, buttonIndex, activeWindow) => {
  switch (message) {
    case text.addFunds:
      // See showNotificationAddFunds() for buttons.
      // buttonIndex === 1 is "Later"; the timestamp until which to delay is set
      // in showNotificationAddFunds() when triggering this notification.
      if (buttonIndex === 0) {
        appActions.changeSetting(settings.PAYMENTS_NOTIFICATIONS, false)
      } else if (buttonIndex === 2 && activeWindow) {
        // Add funds: Open payments panel
        appActions.createTabRequested({
          url: 'about:preferences#payments',
          windowId: activeWindow.id
        })
      }
      break

    case text.reconciliation:
// buttonIndex === 1 is Dismiss
      if (buttonIndex === 0) {
        appActions.changeSetting(settings.PAYMENTS_NOTIFICATIONS, false)
      } else if (buttonIndex === 2 && activeWindow) {
        appActions.createTabRequested({
          url: 'about:preferences#payments',
          windowId: activeWindow.id
        })
      }
      break

    case text.paymentDone:
      if (buttonIndex === 0) {
        appActions.changeSetting(settings.PAYMENTS_NOTIFICATIONS, false)
      }
      break

    case text.tryPayments:
      if (buttonIndex === 1 && activeWindow) {
        appActions.createTabRequested({
          url: 'about:preferences#payments',
          windowId: activeWindow.id
        })
      }
      appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED, true)
      break

    case text.walletConvertedToBat:
      if (buttonIndex === 0) {
        // Open backup modal
        appActions.createTabRequested({
          url: 'about:preferences#payments?ledgerBackupOverlayVisible',
          windowId: activeWindow.id
        })
      }
      break

    default:
      return
  }

  appActions.hideNotification(message)
}

/**
 * Show message that it's time to add funds if reconciliation is less than
 * a day in the future and balance is too low.
 * 24 hours prior to reconciliation, show message asking user to review
 * their votes.
 */
const showEnabledNotifications = (state) => {
  const reconcileStamp = ledgerState.getInfoProp(state, 'reconcileStamp')
  if (!reconcileStamp) {
    return
  }

  if (reconcileStamp - new Date().getTime() < miliseconds.day) {
    if (sufficientBalanceToReconcile(state)) {
      if (shouldShowNotificationReviewPublishers()) {
        const reconcileFrequency = ledgerState.getInfoProp(state, 'reconcileFrequency')
        showReviewPublishers(reconcileStamp + ((reconcileFrequency - 2) * miliseconds.day))
      }
    } else if (shouldShowNotificationAddFunds()) {
      showAddFunds()
    }
  } else if (reconcileStamp - new Date().getTime() < 2 * miliseconds.day) {
    if (sufficientBalanceToReconcile(state) && (shouldShowNotificationReviewPublishers())) {
      showReviewPublishers(new Date().getTime() + miliseconds.day)
    }
  }
}

const showDisabledNotifications = (state) => {
  if (!getSetting(settings.PAYMENTS_NOTIFICATION_TRY_PAYMENTS_DISMISSED)) {
    const firstRunTimestamp = state.get('firstRunTimestamp')
    if (new Date().getTime() - firstRunTimestamp < appConfig.payments.delayNotificationTryPayments) {
      return
    }

    appActions.showNotification({
      from: 'ledger',
      greeting: locale.translation('updateHello'),
      message: text.tryPayments,
      buttons: [
        {text: locale.translation('noThanks')},
        {text: locale.translation('notificationTryPaymentsYes'), className: 'primaryButton'}
      ],
      options: {
        style: 'greetingStyle',
        persist: false
      }
    })
  }
}

const showReviewPublishers = (nextTime) => {
  appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_RECONCILE_SOON_TIMESTAMP, nextTime)

  appActions.showNotification({
    from: 'ledger',
    greeting: text.hello,
    message: text.reconciliation,
    buttons: [
      {text: locale.translation('turnOffNotifications')},
      {text: locale.translation('dismiss')},
      {text: locale.translation('reviewSites'), className: 'primaryButton'}
    ],
    options: displayOptions
  })
}

const showAddFunds = () => {
  const nextTime = new Date().getTime() + nextAddFundsTime
  appActions.changeSetting(settings.PAYMENTS_NOTIFICATION_ADD_FUNDS_TIMESTAMP, nextTime)

  appActions.showNotification({
    from: 'ledger',
    greeting: text.hello,
    message: text.addFunds,
    buttons: [
      {text: locale.translation('turnOffNotifications')},
      {text: locale.translation('updateLater')},
      {text: locale.translation('addFunds'), className: 'primaryButton'}
    ],
    options: displayOptions
  })
}

// Called from observeTransactions() when we see a new payment (transaction).
const showPaymentDone = (transactionContributionFiat) => {
  text.paymentDone = locale.translation('notificationPaymentDone')
    .replace(/{{\s*amount\s*}}/, transactionContributionFiat.amount)
    .replace(/{{\s*currency\s*}}/, transactionContributionFiat.currency)
  // Hide the 'waiting for deposit' message box if it exists
  appActions.hideNotification(text.addFunds)
  appActions.showNotification({
    from: 'ledger',
    greeting: locale.translation('updateHello'),
    message: text.paymentDone,
    buttons: [
      {text: locale.translation('turnOffNotifications')},
      {text: locale.translation('Ok'), className: 'primaryButton'}
    ],
    options: displayOptions
  })
}

const showBraveWalletUpdated = () => {
  appActions.onBitcoinToBatNotified()

  appActions.showNotification({
    from: 'ledger',
    greeting: text.hello,
    message: text.walletConvertedToBat,
    // Learn More.
    buttons: [
      {text: locale.translation('walletConvertedBackup')},
      {text: locale.translation('walletConvertedDismiss')}
    ],
    options: {
      style: 'greetingStyle',
      persist: false,
      advancedLink: 'https://brave.com/faq-payments/#brave-payments',
      advancedText: locale.translation('walletConvertedLearnMore')
    }
  })
}

if (ipc) {
  ipc.on(messages.NOTIFICATION_RESPONSE, (e, message, buttonIndex) => {
    onResponse(
      message,
      buttonIndex,
      electron.BrowserWindow.getActiveWindow()
    )
  })
}

const getMethods = () => {
  const publicMethods = {
    showPaymentDone,
    init,
    onLaunch,
    showBraveWalletUpdated,
    onInterval
  }

  let privateMethods = {}

  if (process.env.NODE_ENV === 'test') {
    privateMethods = {
      setTimeOut: (data) => {
        intervalTimeout = data
      },
      getTimeOut: () => {
        return intervalTimeout
      },
      getPollingInterval: () => {
        return pollingInterval
      }
    }
  }

  return Object.assign({}, publicMethods, privateMethods)
}

module.exports = getMethods()
