use handlebars::*;
use html_editor::operation::*;
use html_editor::{parse, Element, Node};
use std::collections::BTreeMap;
#[derive(Clone, Copy)]
pub struct Template {
    pub name: &'static str,
    pub body: &'static str,
}

pub fn run_hbht(html: &str, templates: Vec<Template>) -> String {
    let mut fragment = parse(html).unwrap();
    process_component_nodes(&mut fragment, &templates);

    fragment.html()
}

fn process_component_nodes(fragment: &mut Vec<Node>, templates: &Vec<Template>) {
    for template in templates {
        fn visit(nodes: &mut Vec<Node>, comp: Template, ts: &Vec<Template>) {
            let Template { name, body } = comp;
            let selector = Selector::from(name);
            for node in nodes.iter_mut() {
                if let Node::Element(ref mut el) = node {
                    if selector.matches(el) {
                        let mut nodes = process_template(el, body); // run handlebars here
                        process_component_nodes(&mut nodes, ts);
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
                        visit(&mut el.children, comp, ts);
                        // el.replace_with(selector, f);
                    }
                }
            }
        }
        visit(fragment, *template, templates);
        //}
    }
}

fn process_template(elem: &Element, hb_body: &str) -> Vec<Node> {
    let mut handlebars = Handlebars::new();
    //handlebars.register_template_string(name, hb_body).unwrap();
    handlebars.register_helper(
        "attr",
        Box::new(
            |h: &Helper,
             _r: &Handlebars,
             _: &Context,
             _rc: &mut RenderContext,
             out: &mut dyn Output|
             -> HelperResult {
                let attr_name = h.param(0).unwrap();
                let attr_default = h.param(1).unwrap();
                dbg!(attr_name.value());
                let okv = elem.attrs.iter().find(|(k, _)| k == attr_name.value());
                dbg!(okv);
                match okv {
                    Some((_, v)) => {
                        out.write(v)?;
                    }
                    None => {
                        out.write(attr_default.value().render().as_ref())?;
                    }
                }
                Ok(())
            },
        ),
    );

    let mut data = BTreeMap::new();
    for (k, v) in elem.attrs.iter() {
        data.insert(k, v);
    }
    let result = handlebars.render_template(hb_body, &data).unwrap();
    return parse(&result).unwrap();
}

/*fn elem_attr(e: &Element, attr_name: &str) -> String {
    let okv = e.attrs.iter().find(|(k, _)| k == attr_name);
    match okv {
        Some((_, v)) => v.to_string(),
        None => panic!("attr {} not found in <{}> element", attr_name, e.name),
    }
}*/
