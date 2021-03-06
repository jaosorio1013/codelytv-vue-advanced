import { mount } from '@vue/test-utils'
import NewGig from '@/app/pages/NewGig/NewGig.vue'
import NewGigPage from '../../../__page_objects__/NewGigPageObject'
import { cloneProductionStore, Wrap } from '../../../../../test/helpers'
import { createGig as createGigSpy } from '../../../services/jota-api'
// The only double that we need to mock
jest.mock('@/app/services/jota-api')
import { createGigPayload } from '../../../services/jota-payloads'

describe('New Gig', () => {
  const PAST_DATETIME = '1900/10/27'
  const FUTURE_DATETIME = '3000/10/27'

  let page, wrapper
  beforeEach(() => {
    wrapper = mount(NewGig, { sync: false, store: cloneProductionStore() })
    page = new NewGigPage(wrapper)
  })

  // it('matches full snapshot', async () => {
  //   page.matchSnapshot()
  // })

  describe('shows validation error', () => {

    describe('when validating title', () => {

      it('and title is cleared', async () => {
        page.dirtyValidation()
        await page.wait()
        expect(page.text()).toContain('Name is required')
      })

      it('and title is too short (async)', async() => {
        page.writeNameAsync(tooShortName())
        await page.wait()
        expect(page.text()).toContain('Minimum 5 characters.')
      })

      it('and title is too short', async () => {
        page.writeName(tooShortName())
        await page.wait()
        expect(page.text()).toContain('Minimum 5 characters.')
      })

      it('and title is too long', async () => {
        page.writeName(tooLongName())
        await page.wait()
        expect(page.text()).toContain('Maximum 20 characters.')
      })
    })

    describe('when validating datetime', () => {
      it('and datetime is cleared', async () => {
        page.dirtyValidation()
        await page.wait()
        expect(page.text()).toContain('Date and time of gig are required.')
      })

      it('and datetime is in the past', async () => {
        page.writeDatetime(PAST_DATETIME)
        await page.wait()
        expect(page.text()).toContain('You cannot set a gig in a past date :(')
      })
    })

    describe('does not show validation error', () => {
      it('and datetime is in the future', async () => {
        page.writeDatetime(FUTURE_DATETIME)
        await page.wait()
        expect(page.hasDatetimeError()).toBe(false)
      })

      it('and title has valid length', async() => {
        page.writeNameAsync(nameWithValidLength())
        await page.wait()
        expect(page.hasNameError()).toBe(false)
      })
    })
  })

  describe('save button', () => {
    it('is disabled by default', async () => {
      expect(page.isSaveButtonDisabled()).toBe(true)
    })

    it('is disabled when form not fully filled', async () => {
      page.writeNameAsync(nameWithValidLength())
      await page.wait()
      expect(page.isSaveButtonDisabled()).toBe(true)
    })

    it('is disabled when form has errors', async () => {
      await page.fillForm(tooShortName(), PAST_DATETIME)
      expect(page.isSaveButtonDisabled()).toBe(true)
    })

    it('is enabled when form is fully filled without errors', async () => {
      await page.fillForm(nameWithValidLength(), FUTURE_DATETIME)
      expect(page.isSaveButtonDisabled()).toBe(false)
    })
  })

  describe('When clicking save button', async () => {
    let store
    beforeEach(async () => {
      store = cloneProductionStore()
      wrapper = Wrap(NewGig).withStore(store).mount()
      page = new NewGigPage(wrapper)

      expect(store.state.days).toEqual({})

      await page.fillForm(nameWithValidLength(), FUTURE_DATETIME)
      page.clickSaveButton()
      await page.wait()
    })

    xit('creates a GIG in the store', async () => {
      expect(store.state.days[FUTURE_DATETIME]).toBeDefined()
    })

    xit('navigates to all gigs route', async () => {
      page.wait()
      page.checkCurrentPath(store, '/all')
    })

    xit('calls backend with appropriate command', async () => {
      // This will be also tested in happy path but in this integration tests we can check all strange cases
      // faster and cheaper
      expect(createGigSpy).toHaveBeenCalledWith(createGigPayload(nameWithValidLength(), FUTURE_DATETIME))
    })
  })
})

function nameWithValidLength() {
  return nameWithLength(5)
}

function tooShortName() {
  return nameWithLength(3)
}

function tooLongName() {
  return nameWithLength(21)
}

function nameWithLength(length) {
  return 'x'.repeat(length)
}

function fillForm(name, date) {
  this.writeNameAsync(name)
  this.writeDatetime(date)
  this.wait()
}
