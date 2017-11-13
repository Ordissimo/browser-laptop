/* global describe, before, after, it */
const mockery = require('mockery')
const assert = require('assert')
const Immutable = require('immutable')
require('../../../braveUnit')
const ledgerMediaProviders = require('../../../../../app/common/constants/ledgerMediaProviders')

describe('ledgerUtil test', function () {
  let ledgerUtil
  let fakeLevel
  const fakeElectron = require('../../../lib/fakeElectron')
  const fakeAdBlock = require('../../../lib/fakeAdBlock')

  before(function () {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    fakeLevel = () => {
    }

    mockery.registerMock('electron', fakeElectron)
    mockery.registerMock('ad-block', fakeAdBlock)
    mockery.registerMock('level', fakeLevel)

    ledgerUtil = require('../../../../../app/common/lib/ledgerUtil')
  })

  after(function () {
    mockery.disable()
  })

  describe('shouldTrackView', function () {
    it('null case', function () {
      assert.equal(ledgerUtil.shouldTrackView(), false)
    })

    it('we have about error, but dont have tab navigationState', function () {
      const param = Immutable.fromJS({
        aboutDetails: {
          title: 'error'
        }
      })
      assert.equal(ledgerUtil.shouldTrackView(param), false)
    })

    it('we have tab, but dont have active entry', function () {
      const param = Immutable.fromJS({
        navigationState: {}
      })
      assert.equal(ledgerUtil.shouldTrackView(param), false)
    })

    it('we have tab, but active entry dont have httpStatusCode', function () {
      const param = Immutable.fromJS({
        navigationState: {
          activeEntry: {}
        }
      })
      assert.equal(ledgerUtil.shouldTrackView(param), false)
    })

    it('we have tab, but httpStatusCode is 500', function () {
      let param = Immutable.fromJS({
        navigationState: {}
      })

      param = param.setIn(['navigationState', 'activeEntry'], {
        httpStatusCode: 500
      })
      assert.equal(ledgerUtil.shouldTrackView(param), false)
    })

    it('we have tab and httpStatusCode is 200', function () {
      let param = Immutable.fromJS({
        navigationState: {}
      })
      param = param.setIn(['navigationState', 'activeEntry'], {
        httpStatusCode: 200
      })
      assert.equal(ledgerUtil.shouldTrackView(param), true)
    })

    it('we have tab and httpStatusCode is 200, but we have aboutDetails', function () {
      let param = Immutable.fromJS({
        aboutDetails: {
          title: 'error'
        },
        navigationState: {}
      })
      param = param.setIn(['navigationState', 'activeEntry'], {
        httpStatusCode: 200
      })
      assert.equal(ledgerUtil.shouldTrackView(param), false)
    })
  })

  describe('batToCurrencyString', function () {
    let ledgerData

    before(function () {
      ledgerData = Immutable.fromJS({
        currentRate: '2',
        rates: {
          'BTC': 0.2222
        }
      })
    })
    it('null case', function () {
      const result = ledgerUtil.batToCurrencyString()
      assert.equal(result, '0.00 USD')
    })

    it('ledgerData is missing', function () {
      const result = ledgerUtil.batToCurrencyString(1)
      assert.equal(result, '')
    })

    it('rates are not defined yet', function () {
      const data = ledgerData.delete('rates')
      const result = ledgerUtil.batToCurrencyString(1, data)
      assert.equal(result, '')
    })

    it('bat is converted', function () {
      const result = ledgerUtil.batToCurrencyString(5, ledgerData)
      assert.equal(result, '10.00 USD')
    })
  })

  describe('formatCurrentBalance', function () {
    let ledgerData

    before(function () {
      ledgerData = Immutable.fromJS({
        paymentId: 'f5240e31-7df6-466d-9606-adc759298731',
        countryCode: 'US',
        unconfirmed: '0.0000',
        hasBitcoinHandler: false,
        bravery: {
          setting: 'adFree',
          days: 30,
          fee: {
            currency: 'USD',
            amount: 10
          }
        },
        currentRate: '1',
        error: null,
        created: true,
        converted: 1.1234,
        buyURL: undefined,
        paymentURL: 'bitcoin:btc-address-goes-here?amount=5&label=Brave%20Software',
        passphrase: 'd588b7e3-352d-49ce-8d0f-a4cae1fa4c76',
        buyMaximumUSD: 6,
        reconcileFrequency: 30,
        currency: 'USD',
        btc: '0.00277334',
        address: 'btc-address-goes-here',
        reconcileStamp: 1405324210587,
        transactions: [],
        amount: 10,
        creating: false,
        balance: 5.00003,
        paymentIMG: undefined,
        rates: {
          'BTC': 0.2222
        }
      })
    })

    it('defaults to 0 as balance when currency is not present', function () {
      const result = ledgerUtil.formatCurrentBalance()
      assert.equal(result, '0.00 BAT')
    })

    it('defaults to 0 as balance when rate is not present', function () {
      const data = ledgerData.delete('rates')
      const result = ledgerUtil.formatCurrentBalance(data)
      assert.equal(result, '5.00 BAT')
    })

    it('formats `balance` and `converted` values to two decimal places', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData)
      assert.equal(result, '5.00 BAT (1.12 USD)')
    })
    it('defaults `balance` to 0 if not found', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData.delete('balance'))
      assert.equal(result, '0.00 BAT (1.12 USD)')
    })
    it('defaults `converted` to 0 if not found', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData.delete('converted'))
      assert.equal(result, '5.00 BAT (0.00 USD)')
    })
    it('handles `balance` being a string', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData.set('balance', '5'))
      assert.equal(result, '5.00 BAT (1.12 USD)')
    })
    it('handles `converted` being a string', function () {
      const result = ledgerUtil.formatCurrentBalance(ledgerData.set('converted', '1.1234'))
      assert.equal(result, '5.00 BAT (1.12 USD)')
    })
  })

  describe('formattedTimeFromNow', function () {
  })

  describe('formattedDateFromTimestamp', function () {
  })

  describe('walletStatus', function () {
  })

  describe('getMediaId', function () {
    it('null case', function () {
      const result = ledgerUtil.getMediaId()
      assert.equal(result, null)
    })

    it('unknown type', function () {
      const result = ledgerUtil.getMediaData({}, 'test')
      assert.equal(result, null)
    })

    describe('Youtube', function () {
      it('null case', function () {
        const result = ledgerUtil.getMediaId(null, ledgerMediaProviders.YOUTUBE)
        assert.equal(result, null)
      })

      it('id is provided', function () {
        const result = ledgerUtil.getMediaId({docid: 'kLiLOkzLetE'}, ledgerMediaProviders.YOUTUBE)
        assert.equal(result, 'kLiLOkzLetE')
      })
    })
  })

  describe('getMediaKey', function () {
    it('null case', function () {
      const result = ledgerUtil.getMediaKey()
      assert.equal(result, null)
    })

    it('type is missing', function () {
      const result = ledgerUtil.getMediaKey('kLiLOkzLetE')
      assert.equal(result, null)
    })

    it('id is null', function () {
      const result = ledgerUtil.getMediaKey(null, ledgerMediaProviders.YOUTUBE)
      assert.equal(result, null)
    })

    it('data is ok', function () {
      const result = ledgerUtil.getMediaKey('kLiLOkzLetE', ledgerMediaProviders.YOUTUBE)
      assert.equal(result, 'youtube_kLiLOkzLetE')
    })
  })

  describe('getMediaData', function () {
    it('null case', function () {
      const result = ledgerUtil.getMediaData()
      assert.equal(result, null)
    })

    it('unknown type', function () {
      const result = ledgerUtil.getMediaData('https://youtube.com', 'test')
      assert.equal(result, null)
    })

    describe('Youtube', function () {
      it('null case', function () {
        const result = ledgerUtil.getMediaData(null, ledgerMediaProviders.YOUTUBE)
        assert.equal(result, null)
      })

      it('query is not present', function () {
        const result = ledgerUtil.getMediaData('https://youtube.com', ledgerMediaProviders.YOUTUBE)
        assert.equal(result, null)
      })

      it('query is present', function () {
        const result = ledgerUtil.getMediaData('https://www.youtube.com/api/stats/watchtime?docid=kLiLOkzLetE&st=11.338&et=21.339', ledgerMediaProviders.YOUTUBE)
        assert.deepEqual(result, {
          docid: 'kLiLOkzLetE',
          st: '11.338',
          et: '21.339'
        })
      })
    })
  })

  describe('getYouTubeDuration', function () {
    it('null case', function () {
      const result = ledgerUtil.getYouTubeDuration()
      assert.equal(result, 0)
    })

    it('multiple times', function () {
      const result = ledgerUtil.getYouTubeDuration({
        st: '11.338,21.339,25.000',
        et: '21.339,25.000,26.100'
      })
      assert.equal(result, 14762)
    })

    it('single time', function () {
      const result = ledgerUtil.getYouTubeDuration({
        st: '11.338',
        et: '21.339'
      })
      assert.equal(result, 10001)
    })
  })

  describe('getMediaProvider', function () {
    it('null case', function () {
      const result = ledgerUtil.getMediaProvider()
      assert.equal(result, null)
    })

    it('unknown provider', function () {
      const result = ledgerUtil.getMediaProvider('https://www.brave.com')
      assert.equal(result, null)
    })

    it('youtube', function () {
      const result = ledgerUtil.getMediaProvider('https://www.youtube.com/api/stats/watchtime?docid=kLiLOkzLetE&st=11.338&et=21.339')
      assert.equal(result, ledgerMediaProviders.YOUTUBE)
    })
  })
})
