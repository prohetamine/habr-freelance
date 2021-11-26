/* --------------------------- */

document.querySelector('[class="custom-form"]').scrollBy(0, 48)
document.querySelector('#open-gh').addEventListener('click', () => {
  chrome.tabs.create({ active: true, url: 'https://github.com/prohetamine/habr-freelance' })
})

/* --------------------------- */

const search = document.getElementById('q')
    , _categories = [...document.querySelectorAll('.category-group__folder')]
    , searchOptions = document.querySelector('.dropdown_inline')
    , options = [...searchOptions.querySelectorAll('[class="checkbox_flat"]')]
    , toggler = searchOptions.querySelector('.toggler')
    , arrow = document.querySelector('.icon-Arrow').cloneNode()
    , onlyMentioned = document.querySelector('#only_mentioned')
    , onlyWithPrice = document.querySelector('#only_with_price')
    , safeDeal = document.querySelector('#safe_deal')
    , onlyUrgent = document.querySelector('#only_urgent')
    , notifyTask = document.querySelector('#notify_task')
    , notifyMessageOwner = document.querySelector('#notify_message_owner')
    , notifyInvite = document.querySelector('#notify_invite')
    , cancel = document.querySelector('#cancel')


chrome.storage.local.get(({
  q = '',
  categories = '',
  fields = '',
  only_urgent = '',
  safe_deal = '',
  only_with_price = '',
  only_mentioned = '',
  notify_task = true,
  notify_message_owner = true,
  notify_invite = true
}) => {
  search.value = q

  onlyUrgent.checked = !!only_urgent
  safeDeal.checked = !!safe_deal
  onlyWithPrice.checked = !!only_with_price
  onlyMentioned.checked = !!only_mentioned

  notifyTask.checked = notify_task
  notifyMessageOwner.checked = notify_message_owner
  notifyInvite.checked = notify_invite

  const searchOptionsValue = fields.split(',')

  options.forEach((option, i) => {
    const checkbox = option.querySelector('input[type="checkbox"]')
    searchOptionsValue.includes(checkbox.getAttribute('name'))
      ? checkbox.checked = true
      : checkbox.checked = false
  })

  const checkboxs = options
                      .map(option => option.querySelector('input[type="checkbox"]'))
                      .flat()

  const labels = options
                  .map(option => option.querySelector('.checkbox__label'))
                  .flat()

  const selectLabels = checkboxs
                          .map(
                            (checkbox, i) =>
                              checkbox.checked
                                ? labels[i].innerHTML
                                : false
                          )
                          .filter(option => option)
                          .join(', ')

  toggler.innerHTML = selectLabels.length === 0
                        ? 'Искать везде'
                        : 'Искать ' + selectLabels
  toggler.appendChild(arrow)

  const categoriesValue = categories.split(',')

  _categories
    .forEach(
      category =>
        [
          ...category.querySelectorAll('input[type="checkbox"]')
        ].forEach(
          checkbox =>
            categoriesValue.includes(checkbox.getAttribute('id'))
              ? (checkbox.checked = true)
              : false
        )
    )

  _categories.forEach((category, i) => {
    const checkboxs = [...category.querySelectorAll('input[type="checkbox"]')]

    const selectedCount = checkboxs.reduce((ctx, checkbox) => ctx + checkbox.checked, 0)

    if (selectedCount === 0) {
      category.classList.remove('full')
      category.classList.remove('part')
      return
    }

    if (selectedCount === checkboxs.length) {
      category.classList.add('full')
      category.classList.remove('part')
      return
    }

    if (selectedCount > 0) {
      category.classList.add('part')
      category.classList.remove('full')
      return
    }
  })
})

search.addEventListener('input', () => {
  chrome.storage.local.set({ q: search.value }, () => {})
})

const categoryHandler = () => {
  const categoriesValue = _categories
                            .map(
                              category =>
                                [
                                  ...category.querySelectorAll('input[type="checkbox"]')
                                ].map(
                                  checkbox =>
                                    checkbox.checked
                                      ? checkbox.getAttribute('id')
                                      : false
                                )
                            )
                            .flat()
                            .filter(category => category)
                            .join(',')

  chrome.storage.local.set({ categories: categoriesValue }, () => {})
}

const searchOptionHandler = () => {
  const searchOptionsValue = options
                              .map(
                                option =>
                                  [
                                    ...option.querySelectorAll('input[type="checkbox"]')
                                  ].map(
                                    checkbox =>
                                      checkbox.checked
                                        ? checkbox.getAttribute('name')
                                        : false
                                  )
                              )
                              .flat()
                              .filter(category => category)
                              .join(',')

  chrome.storage.local.set({ fields: searchOptionsValue }, () => {})
}

_categories.forEach((category, i) => {
  const mainCheckbox = category.querySelector('.checkbox_pseudo')
  const checkboxs = [...category.querySelectorAll('input[type="checkbox"]')]
  const title = category.querySelector('.link_dotted')

  title.addEventListener('click', () => {
    category.classList.contains('category-group__folder_open')
      ? category.classList.remove('category-group__folder_open')
      : category.classList.add('category-group__folder_open')
  })

  mainCheckbox.addEventListener('click', () => {
    if (category.classList.contains('full')) {
      category.classList.remove('full')
      category.classList.remove('part')
      checkboxs.forEach(checkbox => {
        checkbox.checked = false
      })
      categoryHandler()
    } else {
      category.classList.add('full')
      category.classList.remove('part')
      checkboxs.forEach(checkbox => {
        checkbox.checked = true
      })
      categoryHandler()
    }
  })

  checkboxs.forEach(checkbox => {
    checkbox.addEventListener('input', () => {
      categoryHandler()
      const selectedCount = checkboxs.reduce((ctx, checkbox) => ctx + checkbox.checked, 0)

      if (selectedCount === 0) {
        category.classList.remove('full')
        category.classList.remove('part')
        return
      }

      if (selectedCount === checkboxs.length) {
        category.classList.add('full')
        category.classList.remove('part')
        return
      }

      if (selectedCount > 0) {
        category.classList.add('part')
        category.classList.remove('full')
        return
      }
    })
  })
})

searchOptions.addEventListener('click', () => {
  searchOptions.classList.contains('open')
    ? searchOptions.classList.remove('open')
    : searchOptions.classList.add('open')
})

options.forEach((option, i) => {
  const checkboxs = options
                      .map(option => option.querySelector('input[type="checkbox"]'))
                      .flat()

  const labels = options
                  .map(option => option.querySelector('.checkbox__label'))
                  .flat()

  checkboxs[i].addEventListener('input', () => {
    const selectLabels = checkboxs
                          .map(
                            (checkbox, i) =>
                              checkbox.checked
                                ? labels[i].innerHTML
                                : false
                          )
                          .filter(option => option)
                          .join(', ')

    toggler.innerHTML = selectLabels.length === 0
                          ? 'Искать везде'
                          : 'Искать ' + selectLabels
    toggler.appendChild(arrow)
    searchOptionHandler()
  })
})


onlyMentioned.addEventListener('input', () => {
  chrome.storage.local.set({ only_mentioned: onlyMentioned.checked ? 'true' : '' }, () => {})
})

onlyWithPrice.addEventListener('input', () => {
  chrome.storage.local.set({ only_with_price: onlyWithPrice.checked ? 'true' : '' }, () => {})
})

safeDeal.addEventListener('input', () => {
  chrome.storage.local.set({ safe_deal: safeDeal.checked ? 'true' : '' }, () => {})
})

onlyUrgent.addEventListener('input', () => {
  chrome.storage.local.set({ only_urgent: onlyUrgent.checked ? 'true' : '' }, () => {})
})

notifyTask.addEventListener('input', () => {
  chrome.storage.local.set({ notify_task: notifyTask.checked }, () => {})
})

notifyMessageOwner.addEventListener('input', () => {
  chrome.storage.local.set({ notify_message_owner: notifyMessageOwner.checked }, () => {})
})

notifyInvite.addEventListener('input', () => {
  chrome.storage.local.set({ notify_invite: notifyInvite.checked }, () => {})
})

cancel.addEventListener('click', () => {
  chrome.storage.local.set({
    q: '',
    categories: '',
    fields: '',
    only_urgent: '',
    safe_deal: '',
    only_with_price: '',
    only_mentioned: '',
  }, () => {
    location.reload()
  })
})
