/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict'

const Immutable = require('immutable')
const moment = require('moment')
const BigNumber = require('bignumber.js')
const queryString = require('querystring')

// State
const siteSettingsState = require('../state/siteSettingsState')
const ledgerState = require('../state/ledgerState')

// Constants
const settings = require('../../../js/constants/settings')
const ledgerMediaProviders = require('../constants/ledgerMediaProviders')

// Utils
const {responseHasContent} = require('./httpUtil')
const urlUtil = require('../../../js/lib/urlutil')
const getSetting = require('../../../js/settings').getSetting
const urlParse = require('../urlParse')

/**
 * Is page an actual page being viewed by the user? (not an error page, etc)
 * If the page is invalid, we don't want to collect usage info.
 * @param {Map} tabValue - data about provided tab
 * @return {boolean} true if page should have usage collected, false if not
 */
const shouldTrackView = (tabValue) => {
  if (tabValue == null) {
    return false
  }

  const aboutError = tabValue.has('aboutDetails')
  const activeEntry = tabValue.getIn(['navigationState', 'activeEntry']) || {}
  const response = activeEntry.httpStatusCode === 0 || responseHasContent(activeEntry.httpStatusCode)

  return !aboutError && response
}

const batToCurrencyString = (bat, ledgerData) => {
  const balance = Number(bat || 0)
  const currency = 'USD'

  if (balance === 0) {
    return `0.00 ${currency}`
  }

  const hasBeenUpgraded = ledgerData && ledgerData.hasIn(['rates', 'BTC'])
  if (ledgerData == null || !hasBeenUpgraded) {
    return ''
  }

  const rate = ledgerData.get('currentRate') || 0
  const converted = new BigNumber(new BigNumber(rate.toString())).times(balance).toFixed(2)
  return `${converted} ${currency}`
}

const formatCurrentBalance = (ledgerData) => {
  let currency = 'USD'
  let balance = 0
  let converted = 0
  let hasRate = false

  if (ledgerData != null) {
    balance = Number(ledgerData.get('balance') || 0)
    converted = Number.parseFloat(ledgerData.get('converted')) || 0
    hasRate = ledgerData.has('currentRate') && ledgerData.hasIn(['rates', 'BTC'])
  }

  balance = balance.toFixed(2)
  converted = converted.toFixed(2)

  return `${balance} BAT${hasRate ? ` (${converted} ${currency})` : ''}`
}

const formattedTimeFromNow = (timestamp) => {
  moment.locale(navigator.language)
  return moment(new Date(timestamp)).fromNow()
}

const formattedDateFromTimestamp = (timestamp, format) => {
  moment.locale(navigator.language)
  return moment(new Date(timestamp)).format(format)
}

const walletStatus = (ledgerData) => {
  let status = {}

  if (ledgerData.get('error')) {
    status.id = 'statusOnError'
  } else if (ledgerData.get('created')) {
    const transactions = ledgerData.get('transactions')
    const pendingFunds = Number(ledgerData.get('unconfirmed') || 0).toFixed(2)

    if (pendingFunds + Number(ledgerData.get('balance') || 0) <
      0.9 * Number(ledgerData.get('bat') || 0)) {
      status.id = 'insufficientFundsStatus'
    } else if (pendingFunds > 0) {
      status.id = 'pendingFundsStatus'
      status.args = {funds: `${pendingFunds} BAT (${batToCurrencyString(pendingFunds, ledgerData)})`}
    } else if (transactions && transactions.size > 0) {
      status.id = 'defaultWalletStatus'
    } else {
      status.id = 'createdWalletStatus'
    }
  } else if (ledgerData.get('creating')) {
    status.id = 'creatingWalletStatus'
  } else {
    status.id = 'createWalletStatus'
  }
  return status
}

// TODO rename function
const blockedP = (state, publisherKey) => {
  const pattern = urlUtil.getHostPattern(publisherKey)
  const ledgerPaymentsShown = siteSettingsState.getSettingsProp(state, pattern, 'ledgerPaymentsShown')

  return ledgerPaymentsShown === false
}

// TODO rename
const contributeP = (state, publisherKey) => {
  const publisher = ledgerState.getPublisher(state, publisherKey)
  return (
    (stickyP(state, publisherKey) || publisher.getIn(['options', 'exclude']) !== true) &&
    eligibleP(state, publisherKey) &&
    !blockedP(state, publisherKey)
  )
}

// TODO rename function
const visibleP = (state, publisherKey) => {
  const publisher = ledgerState.getPublisher(state, publisherKey)
  let showOnlyVerified = ledgerState.getSynopsisOption(state, 'showOnlyVerified')

  if (showOnlyVerified == null) {
    showOnlyVerified = getSetting(settings.PAYMENTS_ALLOW_NON_VERIFIED)
    state = ledgerState.setSynopsisOption(state, 'showOnlyVerified', showOnlyVerified)
  }

  const publisherOptions = publisher.get('options', Immutable.Map())
  const onlyVerified = !showOnlyVerified

  // Publisher Options
  const deletedByUser = blockedP(state, publisherKey)
  const eligibleByStats = eligibleP(state, publisherKey) // num of visits and time spent
  const verifiedPublisher = publisherOptions.get('verified')

  return (
      eligibleByStats &&
      (
        (onlyVerified && verifiedPublisher) ||
        !onlyVerified
      )
    ) &&
    !deletedByUser
}

// TODO rename function
const eligibleP = (state, publisherKey) => {
  const scorekeeper = ledgerState.getSynopsisOption(state, 'scorekeeper')
  const minPublisherDuration = ledgerState.getSynopsisOption(state, 'minPublisherDuration')
  const minPublisherVisits = ledgerState.getSynopsisOption(state, 'minPublisherVisits')
  const publisher = ledgerState.getPublisher(state, publisherKey)

  return (
    publisher.getIn(['scores', scorekeeper]) > 0 &&
    publisher.get('duration') >= minPublisherDuration &&
    publisher.get('visits') >= minPublisherVisits
  )
}

// TODO rename function
const stickyP = (state, publisherKey) => {
  const pattern = urlUtil.getHostPattern(publisherKey)
  let result = siteSettingsState.getSettingsProp(state, pattern, 'ledgerPayments')

  if (result == null) {
    const excluded = ledgerState.getPublisherOption(state, publisherKey, 'exclude')

    if (excluded != null) {
      result = !excluded
    }
  }

  return (result === undefined || result)
}

const getMediaId = (data, type) => {
  let id = null

  if (type == null || data == null) {
    return id
  }

  switch (type) {
    case ledgerMediaProviders.YOUTUBE:
      {
        id = data.docid
        break
      }
  }

  return id
}

const getMediaKey = (id, type) => {
  if (id == null || type == null) {
    return null
  }

  return `${type.toLowerCase()}_${id}`
}

const getMediaData = (xhr, type) => {
  let result = null

  if (xhr == null || type == null) {
    return result
  }

  switch (type) {
    case ledgerMediaProviders.YOUTUBE:
      {
        const parsedUrl = urlParse(xhr)
        let query = null

        if (parsedUrl && parsedUrl.query) {
          query = queryString.parse(parsedUrl.query)
        }
        result = query
        break
      }
  }

  return result
}

const getMediaDuration = (data, type) => {
  let duration = 0
  switch (type) {
    case ledgerMediaProviders.YOUTUBE: {
      duration = getYouTubeDuration(data)
      break
    }
  }

  return duration
}

const getYouTubeDuration = (data) => {
  let time = 0

  if (data == null || data.st == null || data.et == null) {
    return time
  }

  const startTime = data.st.split(',')
  const endTime = data.et.split(',')

  if (startTime.length !== endTime.length) {
    return time
  }

  for (let i = 0; i < startTime.length; i++) {
    time += parseFloat(endTime[i]) - parseFloat(startTime[i])
  }

  // we get seconds back, so we need to convert it into ms
  time = time * 1000

  return parseInt(time)
}

const getMediaProvider = (url) => {
  let provider = null

  if (url == null) {
    return provider
  }

  // Youtube
  if (url.startsWith('https://www.youtube.com/api/stats/watchtime?')) {
    provider = ledgerMediaProviders.YOUTUBE
  }

  return provider
}

const getMethods = () => {
  const publicMethods = {
    shouldTrackView,
    batToCurrencyString,
    formattedTimeFromNow,
    formattedDateFromTimestamp,
    walletStatus,
    blockedP,
    contributeP,
    visibleP,
    eligibleP,
    stickyP,
    formatCurrentBalance,
    getMediaId,
    getMediaDuration,
    getMediaProvider,
    getMediaData,
    getMediaKey
  }

  let privateMethods = {}

  if (process.env.NODE_ENV === 'test') {
    privateMethods = {
      getYouTubeDuration
    }
  }

  return Object.assign({}, publicMethods, privateMethods)
}

module.exports = getMethods()
