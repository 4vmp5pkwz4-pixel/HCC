# HCC × OpenAI Math: карта переноса и наблюдаемость S³

Дата: 10 октября 2026. Исходный HCC: `a17209c6740ca28801dfa7e51bc45e1d7ac319ba`.
Каталог: [openai/math, fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb](https://github.com/openai/math/tree/fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb).
Интерактивный раздел: [math.html](../math.html). Полные машиночитаемые паспорта:
[каталог](../api/math-catalog.json), [связи и условия](../api/math-bridges.json).

## Что завершено

Индексированы все **372 действующих семейства и 719 рукописей**, включая companion papers и их аннотации. Семейные номера идут до 377 и имеют пропуски; число 377 не является числом действующих семейств. Источники, ссылки и хеши зафиксированы. Три отозванные 7 октября работы исключены из действующего индекса и перечислены отдельно.

Проверены оригинальные формулировки и условия **21 релевантного семейства**; карта содержит **23 источниковых связи и 17 задач**. Это проверка формулировок, применимости и указанного покрытия формализаций. Полного независимого воспроизведения всех доказательств, Lean build, axiom audit и проверки семантического равенства формальных и текстовых утверждений здесь нет. Остальные семейства имеют уровень `CATALOG_METADATA_ONLY`.

Подтверждённых внешних закрытий CEF, unforced Clay, глобального CR-склеивания или полной Kerr–Newman деформации не установлено. Завершены собственный количественный результат для конечной скалярной полосы на exact round S³ и точное препятствие переносу одночастичной положительно заряженной плазмы. Эти локальные результаты не зависят от правильности новых доказательств каталога.

## Источники и точные границы

| Семейство | Полезный объект или метод | Ограничение переноса |
|---|---|---|
| 062 | Contact-Fano classification, global descent | Complex projective contact ≠ real CR/S³; нет EM/CR-морфизма |
| 077 | Fourier extension и wave-packet estimates | Euclidean surface extension ≠ ограничение гармоник S³ |
| 119 | Binary information contraction | Uniform cube и independent bit noise; нет общего физического capacity bound |
| 140 | Memory–sample lower bound | One-pass finite-state iid Gaussian regression; нет универсального ограничения наблюдателя |
| 148 | Entropy-rate dimension self-similar measures | IFS на R; exact overlaps требуют h_RW, а не H(p); φ не выбирается |
| 260 | Kerr–Newman mass/area bound; Bondi end replacement | Axisymmetry, AF/CKS asymptotics, branch и enclosing area; нет BMS memory или EM deformation |
| 264 | Near-Kerr vacuum SCC | Rotating subextremal, two-ended, residual-generic; нет Kerr–Newman matter coupling |
| 265 | Gapped 2D lattice area law; PEPS existence | q — local site dimension; не CEF capacity, black-hole entropy или efficient PEPS algorithm |
| 290 | Bounded modular spectral recovery | Scalar centralizer; нет automatic finite-factor trace transfer |
| 294 | Quasitrace и stable-finiteness obstacles | General C* examples не определяют физический trace HCC |
| 298 | Separation of two free entropies | Требуется точное определение энтропии; нет horizon entropy |
| 301 | Trace cone и stabilized classification | Не выбирает canonical/normal/finite faithful weight |
| 336 | Bounded-width quotient | Не inverse/observability; на round S³ 500R/√6 > πR |
| 348 | Positive-Einstein Riemannian 4D rigidity | Не Lorentzian spacetime или пространственная S³ |
| 350 | Smooth near-round S³ nodal counterexamples | Exact round metric и finite-band identities не опровергнуты |
| 351 | 4D Ricci extension и higher-dimensional counterexample | Riemannian Ricci PDE; для контрпримера существует sufficiently large q≥10, dimension q+3≥13 |
| 361 | Polynomial-growth harmonic counting | Noncompact R³; не compact Laplace eigenmodes S³ |
| 362 | Flat one-species relativistic Vlasov–Maxwell | R³; nonnegative charge без background не переносится на closed S³ |
| 365 | Joint smooth metric/connection DN uniqueness; rough nonuniqueness | Нужна физическая граница и полный оператор; cap и sky не заменяют DN |
| 372 | Smooth isotropic elasticity uniqueness | Known Euclidean domain и full boundary traction; нет finite/noisy stability |
| 376 | Forced incompressible universal computation | Direct candidate только для соответствующей forced flat-torus модели; не unforced Clay/S³ regularity |

### Покрытие Lean нельзя переносить с семейства на каждую рукопись

- **260:** указаны end replacement и Schwarzschild examples; general Bondi inequality и выбранный Kerr–Newman theorem этим не сертифицированы.
- **290:** указан bounded recovery; absolute bicentralizer и general relative expected-subalgebra conclusions находятся вне указанного покрытия.
- **301:** указаны trace-ideal transport и additive-idempotent ideal weights; spatial stabilization classification не покрыта этим supporting comparator.
- **348:** указан strictly positive sectional Einstein case; zero-plane/nonnegative boundary case и L² gap не следуют из этого артефакта.
- **361:** выбран другой companion — dimension 16, degree 50000; не выбранный трёхмерный theorem.
- **365:** указан bounded measurable scalar nonuniqueness companion; не joint smooth metric/connection uniqueness, и localized 2^m corollary отдельно не указан.
- **376:** перечислены другие constituent constructions; selected Finite Instructions theorem нельзя маркировать проверенным по семейной ссылке.

Точные source paths, номера утверждений, прочитанные документы, найденные comparator declarations, исключения и source hashes сохранены в `api/math-bridges.json`. Существование ссылки в `formalization.yaml` записано как метаданные, а не как результат локальной проверки.

## Лемма: конечнополосная наблюдаемость и усиление ошибки

Пусть S³ имеет точную круглую метрику радиуса R. Используем безразмерное геодезическое расстояние θ=d/R и нормированный полный объём. Пусть H_L — пространство всех скалярных сферических гармоник степеней 0≤n≤L. Число мод:

\[
N_L=\sum_{n=0}^L(n+1)^2=\frac{(L+1)(L+2)(2L+3)}6.
\]

Радиальный сектор относительно выбранного центра имеет лишь L+1 мод. Его ортонормированный базис в мере (2/π)sin²θ dθ:

\[
U_n(\cos\theta)=\frac{\sin((n+1)\theta)}{\sin\theta}.
\]

Устранимые особенности при θ=0,π понимаются по пределу. Для открытой области C_χ={θ<χ}, 0<χ≤π, ограничение T:H_L→L²(C_χ) использует ту же исходную нормированную меру — мера области НЕ перенормируется на единицу. Её доля объёма:

\[
v(\chi)=\frac{\chi-\sin\chi\cos\chi}{\pi}.
\]

Радиальная Gram-матрица получается непосредственно из 2sin(aθ)sin(bθ)=cos((a−b)θ)−cos((a+b)θ):

\[
G_{nm}(\chi)=\frac1\pi\left[
\frac{\sin((n-m)\chi)}{n-m}-\frac{\sin((n+m+2)\chi)}{n+m+2}\right].
\]

При n=m первый член равен χ. В частности, G₀₀=v(χ), G(π)=I.

**Инъективность.** Каждый элемент конечной полосы — real analytic function на связной round S³. Если его ограничение равно нулю в L² открытой области, непрерывность даёт нуль на всей области, а аналитическое продолжение — нуль на S³. Следовательно, T инъективен. Это утверждение про непрерывные noiseless данные, а не про конечный набор пикселей или детекторов.

**Количественная оценка.** Полином f_L(θ)=(1−cosθ)^L лежит в радиальном секторе H_L: полином степени L по cosθ раскладывается по U₀,…,U_L. Его концентрация:

\[
r_L(\chi)=\frac{\int_0^\chi(1-\cos\theta)^{2L}\sin^2\theta\,d\theta}
{\int_0^\pi(1-\cos\theta)^{2L}\sin^2\theta\,d\theta}
=I_{\sin^2(\chi/2)}\!\left(2L+\frac32,\frac32\right).
\]

Последнее равенство следует из x=sin²(θ/2): sin²θ dθ=4√(x(1−x))dx и (1−cosθ)^{2L}=2^{2L}x^{2L}. Rayleigh quotient даёт σ_min(T)²≤r_L. Постоянная нормированная функция даёт σ_max(T)²≥v. Поэтому:

\[
\|T^{-1}\|_{\operatorname{im}T\to H_L}\ge r_L^{-1/2},\qquad
\kappa(T)\ge\sqrt{\frac{v}{r_L}}.
\]

Это lower bounds, а не вычисленные точные singular values или condition number. Использование одного radial witness корректно для полного H_L, поскольку radial sector — его подпространство.

При малой области:

\[
r_L(\chi)\sim
\frac{\chi^{4L+3}}{2^{4L+3}(2L+3/2)\,B(2L+3/2,3/2)}.
\]

Для L=6, χ=4.8°: N_L=140, v≈1.2459627356×10⁻⁴,
log₁₀‖T⁻¹‖≥18.2889978651 и log₁₀κ(T)≥16.3367503919.
Это пример заданной геометрии и полосы; он не оценивает реальную ошибку космологической реконструкции.

**Численная реализация.** Kernel `core/math/s3-cap-observability.mjs` общий для UI и SDK. Диапазон реализации: целые 0≤L≤48, 0<χ≤π. Taylor-разность предотвращает вычитание почти одинаковых sinc при малой χ; concentration вычисляется через regularized incomplete beta в логарифмах. Логарифмы объёма и concentration вычисляются до возведения очень малого угла в степень и остаются конечными вплоть до минимального положительного binary64. При underflow объёма или concentration возвращается `null`, а не ложный точный нуль; `log10_volume_fraction` сохраняет оценку объёма. При χ=π матрица возвращается как exact identity. Отдельного eigenvalue certificate нет; очень малые общие eigenvalues не объявляются измеренными или достоверно вычисленными.

## Лемма: глобальная нейтральность

На закрытом гладком пространстве M с глобальным гладким электрическим полем закон div E=ρ и теорема Стокса дают:

\[
\int_M\rho\,dV=\int_M\operatorname{div}E\,dV=0.
\]

Если ρ=∫f dv, f≥0 и нет background или противоположного заряда, то f=0 почти всюду; при гладкости — всюду. Следовательно, ненулевой flat one-species theorem 362 не переносится неизменным на закрытую S³. Это точное препятствие, а не утверждение против нейтральной многокомпонентной плазмы. Для неё требуется собственная curved-space система и доказательство.

## Проверки и воспроизведение

Полный запуск `HCC_VERIFY_ALL=1 npm test`: **183 из 183 проверок прошли**, включая валидацию атласа и agent unit tests. `node scripts/extract-kernels.mjs --check` также прошёл: 2099 извлечённых объявлений согласованы.

`node --test test/math-atlas.test.mjs`: независимое angular Simpson integration для Gram и witness, полный объём, сумма multiplicity, full-sphere identity, малые области и underflow вплоть до `Number.MIN_VALUE`, отказы за пределами области, полный индекс и запрет автоматического закрытия по topic/Lean badge.

Дополнительная независимая проверка с mpmath при 80 десятичных знаках: 47 пар (L,χ): L∈{0,1,6,24,48}, χ от 10⁻⁶ до π−10⁻⁶, плюс крайние χ=10⁻¹¹⁰, 10⁻¹⁶², 10⁻²⁰⁰ и `Number.MIN_VALUE` при L∈{0,6,48}. Максимальное абсолютное расхождение логарифмических оценок — 7.28×10⁻¹². mpmath не является зависимостью сайта или kernel.

`python scripts/import-math-catalog.py --source-dir DIR --output api/math-catalog.json` воспроизводит индекс из трёх файлов зафиксированного upstream commit. Импорт останавливается при несовпадении числа семейств/рукописей или повторе путей. Upstream licence и attribution: `docs/third-party/`.

Исходный реестр 295 open problems сохраняется полностью. Тематическое сопоставление по laboratory ID явно маркируется кандидатом, а не доказательством закрытия каждой исторической задачи. Math workspace имеет собственный snapshot; существующие физические параметры и сценические вычисления не меняются. Kernel доступен в static SDK и не объявлен новым HTTP/MCP instrument.

Браузерная/визуальная проверка нового workspace не выполнялась: в среде нет поддерживаемого browser-control пути. Это ограничение UI QA; численные и источниковые проверки выполняются отдельно.
