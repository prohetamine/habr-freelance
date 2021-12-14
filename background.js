let SKIP_MESSAGES = true

const delay = ms => new Promise(res => setTimeout(res, ms))

const tasksParser = response => {
  const taskHTML = response
    .replace(/\n/gi, '')
    .match(/var content = '';var pagination = '';content \+= ".+;pagination \+= "/gi)[0]
    .replace(/(var content = '';var pagination = '';content \+= "|;pagination \+= ")/gi, '')
    .replace(/\\/gi, '')

  const tasksTitle = taskHTML
                      .match(/class="task__title" title="[^"]+/gi)
                      .map(
                        html =>
                          html.replace(/class="task__title" title="/, '').trim()
                      )

  const tasksCount = taskHTML
                      .match(/(span class='count'|span class='negotiated_price')>[^<]+/gi)
                      .map(
                        html =>
                          html.replace(/(span class='count'|span class='negotiated_price')>/, '').trim()
                      )

  const tasksId = taskHTML
                      .match(/<a href="\/tasks\/\d+/gi)
                      .map(
                        html =>
                          html.replace(/<a href="\/tasks\//, '').trim()
                      )

  return Array(tasksTitle.length).fill(false).map((_, i) => ({
    title: tasksTitle[i],
    count: tasksCount[i],
    id: tasksId[i]
  }))
}

const getResponses = () =>
  fetch('https://freelance.habr.com/my/responses')
    .then(response => response.text())
    .then(response => (r => r ? r.map(task => task.match(/\d+/)[0]) : [])(response.match(/\/tasks\/\d+/gi)))

const getInvites = () =>
  fetch('https://freelance.habr.com/my/responses/invites')
    .then(response => response.text())
    .then(response => (r => r ? r.map(task => task.match(/\d+/)[0]) : [])(response.match(/\/tasks\/\d+/gi)))

const getOwnerDialog = taskId =>
  fetch(`https://freelance.habr.com/tasks/${taskId}`)
    .then(response => response.text())
    .then(
      response => (
        hrefDialog =>
          hrefDialog
            ? `https://freelance.habr.com${hrefDialog}`
            : false
      )(
        response.match(/\/tasks\/\d+\/conversations\/\d+/)
      )
    )

const getOwnerMessages = dialogUrl =>
  fetch(dialogUrl, {
    'headers': {
      'accept': 'application/json'
    }
  })
  .then(response => response.json())
  .then(({ conversation: { hirer: { user }, messages } }) => ({
    username: user.username,
    avatar: user.avatar.src2x,
    messages: messages
                .filter(message => message.user.username === user.username)
                .map(message => ({ body: message.body, id: message.id }))
  }))

const getTask = async taskId =>
  fetch(`https://freelance.habr.com/tasks/${taskId}`)
    .then(response => response.text())
    .then(response => {
      try {
        const title = response
                        .match(/<meta content='[^']+/gi)[0]
                        .replace("<meta content='", '')

        const count = response
                        .match(/(class='negotiated_price'>[^<]+|class='count'>[^<]+)/gi)[0]
                        .replace(/(class='negotiated_price'>|class='count'>)/, '')
                        .trim()
        return {
          id: taskId,
          title,
          count
        }
      } catch (e) {
        return false
      }
    })

const pushNotification = (id, option) => {
  chrome.storage.local.get(state => {
    SKIP_MESSAGES || state[id] || chrome.notifications.create(id, option)
    chrome.storage.local.set({ [id]: true }, () => { /* save */ })
  })
}

const taskChecker = () =>
  chrome.storage.local.get(({
    q = '',
    categories = '',
    fields = '',
    only_urgent = '',
    safe_deal = '',
    only_with_price = '',
    only_mentioned = ''
  }) => {
    try {
      fetch(`https://freelance.habr.com/tasks?_=${
        new Date() - 0
      }${
        q ? `&q=${q}` : ''
      }${
        categories ? `&categories=${categories}` : ''
      }${
        fields ? `&fields=${fields}` : ''
      }${
        only_urgent ? `&only_urgent=${only_urgent}` : ''
      }${
        safe_deal ? `&safe_deal=${safe_deal}` : ''
      }${
        only_with_price ? `&only_with_price=${only_with_price}` : ''
      }${
        only_mentioned ? `&only_mentioned=${only_mentioned}` : ''
      }`, {
        'headers': {
          'accept': 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01',
          'x-requested-with': 'XMLHttpRequest'
        }
      })
      .then(response => response.text())
      .then(response => {
        const tasks = tasksParser(response)

        tasks.forEach(({ title, count, id }, i) => {
          const notificationId = 'task_'+id

          pushNotification(notificationId, {
            title: 'Заказы',
            message: `${title} — ${count}`,
            iconUrl: '/logo.jpg',
            type: 'basic'
          })
        })
      })
    } catch (err) {
      console.log(err)
    }
  })

const dialogChecker = async () => {
  try {
    const responses = await getResponses()

    const responsesDialogUrls = (
      await Promise.all(responses.map(getOwnerDialog))
    )
    .filter(f => f)

    const ownerMessages = (
      await Promise.all(responsesDialogUrls.map(getOwnerMessages))
    )

    ownerMessages.forEach(({ avatar, messages, username }, i) => {
      const [taskId, dialogId] = responsesDialogUrls[i].match(/\d+/gi)

      messages.forEach(message => {
        const notificationId = 'dialog_'+taskId+'-'+dialogId+'-'+message.id

        pushNotification(notificationId, {
          title: `Сообщение от ${username}`,
          message: message.body,
          iconUrl: avatar.match(/https/) ? avatar : `https://freelance.habr.com/${avatar}`, // ну вот так хабр
          type: 'basic'
        })
      })
    })
  } catch (err) {
    console.log(err)
  }
}

const inviteChecker = async () => {
  try {
    const invites = await getInvites()

    const taskInvites = (
      await Promise.all(invites.map(getTask))
    )
    .filter(f => f)

    taskInvites.forEach(({ title, count, id }, i) => {
      const notificationId = 'invite_'+id

      pushNotification(notificationId, {
        title: 'Вас пригласили',
        message: `${title} — ${count}`,
        iconUrl: '/logo.jpg',
        type: 'basic'
      })
    })
  } catch (err) {
    console.log(err)
  }
}

chrome.notifications.onClicked.addListener(data => {
  const [type, id] = data.split('_')

  if (type === 'task' || type === 'invite') {
    chrome.tabs.create({ url: `https://freelance.habr.com/tasks/${id}` })
  }

  if (type === 'dialog') {
    const [taskId, dialogId] = id.split('-')
    chrome.tabs.create({ url: `https://freelance.habr.com/tasks/${taskId}/conversations/${dialogId}` })
  }
})

chrome.alarms.create({ periodInMinutes: 0.15 })

;(async () => {
  await taskChecker()
  await delay(5000)
  await dialogChecker()
  await delay(5000)
  await inviteChecker()
  await delay(5000)

  SKIP_MESSAGES = false /* Разрешаем отправлять уведомления после того как пропустили все старые */

  chrome.alarms.onAlarm.addListener(() => {
    chrome.storage.local.get(async ({
      notify_task = true,
      notify_message_owner = true,
      notify_invite = true
    }) => {
      if (notify_task) {
        await taskChecker()
        await delay(5000)
      }

      if (notify_message_owner) {
        await dialogChecker()
        await delay(5000)
      }

      if (notify_invite) {
        await inviteChecker()
      }
    })
  })
})()
