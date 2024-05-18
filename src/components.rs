//use html5ever::tree_builder::TreeSink;
use html_editor::operation::*;
use html_editor::{parse, Element, Node};
pub fn five() -> f64 {
    5.3
}
#[derive(Clone, Copy)]
struct Component {
    name: &'static str,
    process: fn(&Element) -> Vec<Node>,
}

const COMPONENTS: [Component; 1] = [Component {
    name: "xy-plot",
    process: xy_process,
}];

fn xy_process(e: &Element) -> Vec<Node> {
    let id = elem_attr(e, "id");
    let traces = e.query_all(&Selector::from("trace"));

    let trace_defns: Vec<String> = traces
        .iter()
        .map(|tr_e| {
            format!(
                "{{
                    x: rainyEvalExpr(\"{}\"),
                    y: rainyEvalExpr(\"{}\"),
                    type: '{}'
                  }}",
                elem_attr(tr_e, "x"),
                elem_attr(tr_e, "y"),
                elem_attr(tr_e, "type")
            )
        })
        .collect();
    let all_traces_defs = trace_defns.join(",");

    parse(&format!(
        r#"<div id="{}"></div>
<script type="text/rainy-loop-js">
Plotly.newPlot('{}', [{}]);
</script>"#,
        id, id, all_traces_defs
    ))
    .unwrap()
}

fn elem_attr(e: &Element, attr_name: &str) -> String {
    let okv = e.attrs.iter().find(|(k, _)| k == attr_name);
    match okv {
        Some((_, v)) => v.to_string(),
        None => panic!("attr {} not found in <{}> element", attr_name, e.name),
    }
}

pub fn process_components(html: &str) -> String {
    let mut fragment = parse(html).unwrap();
    process_component_nodes(&mut fragment);
    fragment.html()
}

fn process_component_nodes(fragment: &mut Vec<Node>) {
    for component in COMPONENTS {
        fn visit(nodes: &mut Vec<Node>, comp: Component) {
            let Component { name, process } = comp;
            let selector = Selector::from(name);
            for node in nodes.iter_mut() {
                if let Node::Element(ref mut el) = node {
                    if selector.matches(el) {
                        let mut nodes = process(el);
                        process_component_nodes(&mut nodes);
                        if nodes.len() == 1 {
                            let new_node = nodes[0].clone();
                            *node = new_node;
                        } else {
                            let new_node = Node::Element(Element {
                                name: String::from("div"),
                                attrs: vec![],
                                children: nodes,
                            });
                            *node = new_node;
                        }
                    } else {
                        visit(&mut el.children, comp);
                        // el.replace_with(selector, f);
                    }
                }
            }
        }
        visit(fragment, component);
    }
}
