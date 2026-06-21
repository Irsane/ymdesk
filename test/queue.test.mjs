import assert from 'node:assert'
import { Queue, idOf } from '../src/queueEngine.js'

let passed = 0
const t = (name, fn) => { fn(); passed++; console.log('  ✓', name) }

const mk = (ids) => ids.map(id => ({ id, title: 't' + id, albums: [{ id: id * 10 }] }))

t('setList ставит первый трек', () => {
  const q = new Queue(); q.setList(mk([1, 2, 3]))
  assert.equal(idOf(q.current()), '1')
  assert.equal(q.index, 0)
})

t('next идёт по очереди', () => {
  const q = new Queue(); q.setList(mk([1, 2, 3]))
  assert.equal(q.peekNext(), 1); q.setIndex(1)
  assert.equal(q.peekNext(), 2); q.setIndex(2)
  assert.equal(q.peekNext({ repeat: 'off' }), null, 'в конце без повтора — null')
})

t('repeat=all зацикливает', () => {
  const q = new Queue(); q.setList(mk([1, 2])); q.setIndex(1)
  assert.equal(q.peekNext({ repeat: 'all' }), 0)
})

t('prev назад и не уходит ниже нуля', () => {
  const q = new Queue(); q.setList(mk([1, 2, 3])); q.setIndex(2)
  assert.equal(q.peekPrev(), 1); q.setIndex(0)
  assert.equal(q.peekPrev(), 0)
})

t('append добавляет только новые (дедуп)', () => {
  const q = new Queue(); q.setList(mk([1, 2, 3]))
  const fresh = q.append(mk([2, 3, 4, 5])) // 2,3 — дубли
  assert.deepEqual(fresh.map(idOf), ['4', '5'])
  assert.equal(q.tracks.length, 5)
})

t('после append next доходит до новых треков', () => {
  const q = new Queue(); q.setList(mk([1, 2])); q.setIndex(1)
  assert.equal(q.peekNext({ repeat: 'off' }), null) // конец
  q.append(mk([3, 4]))
  assert.equal(q.peekNext(), 2) // теперь есть следующий
})

t('needsPrefetch срабатывает за 2 трека до конца', () => {
  const q = new Queue(); q.setList(mk([1, 2, 3, 4, 5]), async () => [])
  q.setIndex(2); assert.equal(q.needsPrefetch(), false)
  q.setIndex(3); assert.equal(q.needsPrefetch(), true)
  q.setIndex(4); assert.equal(q.needsPrefetch(), true)
})

t('без extender prefetch не нужен', () => {
  const q = new Queue(); q.setList(mk([1, 2, 3]))
  q.setIndex(2); assert.equal(q.needsPrefetch(), false)
})

t('shuffle с детерминированным rng', () => {
  const q = new Queue(); q.setList(mk([1, 2, 3, 4]))
  assert.equal(q.peekNext({ shuffle: true, rng: () => 0.5 }), 2)
})

t('бесконечная волна: 50 скипов всегда дают трек при работающем extender', () => {
  const q = new Queue()
  let counter = 100
  // extender отдаёт новые уникальные треки
  q.setList(mk([1, 2, 3, 4, 5]), () => mk([counter++, counter++]))
  let played = 0
  for (let step = 0; step < 50; step++) {
    let n = q.peekNext({ repeat: 'off' })
    if (n === null) {
      // имитируем догрузку
      q.append(q.extender())
      n = q.peekNext({ repeat: 'off' })
    }
    assert.notEqual(n, null, 'на шаге ' + step + ' должен быть следующий трек')
    q.setIndex(n); played++
  }
  assert.equal(played, 50)
})

t('волна с повторяющимся extender (ротор отдаёт дубли) не зацикливает молча', () => {
  const q = new Queue()
  q.setList(mk([1, 2, 3]), () => mk([1, 2, 3])) // всегда те же
  q.setIndex(2)
  const fresh = q.append(q.extender())
  assert.equal(fresh.length, 0, 'дубли не добавляются')
  assert.equal(q.peekNext({ repeat: 'off' }), null, 'честно конец, без повтора одинаковых')
})

console.log(`\n${passed} тестов прошли ✅`)
